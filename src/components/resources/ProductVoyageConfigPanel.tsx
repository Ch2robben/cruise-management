import { useEffect, useState } from 'react'
import type { ProductPrivilege, TemplateDeposit, TemplateTip } from '@/types'
import { generateId } from '@/utils/format'
import type { HierarchicalDictOption } from '@/utils/hierarchicalDict'
import { loadHierarchicalDictOptions } from '@/utils/hierarchicalDict'
import type { ProductSegmentOption } from '@/utils/productVoyageConfig'
import { initialAdditionalProducts, additionalProductCategories, getAdditionalCategoryPath } from '@/mock/additionalProducts'

export interface ProductVoyageConfigValue {
  deposits: TemplateDeposit[]
  tips: TemplateTip[]
  configuredRoomTypes: string[]
  privileges: ProductPrivilege[]
  presaleDays: number
  cutoffDays: number
  refundPolicy: string
  materialReq: string[]
  additionalProductIds: string[]
}

const TABS = ['房型配置', '航次定金', '销售规则', '小费配置', '礼遇配置', '附加产品'] as const
const refundPolicies = ['标准退改', '严格退改', '灵活退改']
const materialOptions = ['宣传册', '行程单', '保险单', '签证指南']

const DEFAULT_ROOM_TYPES = ['标准间', '套房', '阳台房', '海景房', '内舱房', '豪华套房', '总统套房']

const emptyDep = (segmentKey = ''): TemplateDeposit => ({ id: generateId(), segmentKey, roomType: '', deposit: 0 })
const emptyTip = (segmentKey = ''): TemplateTip => ({ id: generateId(), segmentKey, roomType: '', tip: 0, mandatory: true })
const emptyPrivilege = (roomType = ''): ProductPrivilege => ({ id: generateId(), roomType, privilegeName: '' })

export const emptyProductVoyageConfig = (): ProductVoyageConfigValue => ({
  deposits: [],
  tips: [],
  configuredRoomTypes: [],
  privileges: [],
  presaleDays: 0,
  cutoffDays: 0,
  refundPolicy: '',
  materialReq: [],
  additionalProductIds: [],
})

const toggleArray = (arr: string[], val: string): string[] =>
  arr.includes(val) ? arr.filter((item) => item !== val) : [...arr, val]

interface ProductVoyageConfigPanelProps {
  tab: number
  onTabChange: (tab: number) => void
  value: ProductVoyageConfigValue
  onChange: (value: ProductVoyageConfigValue) => void
  segmentOptions?: ProductSegmentOption[]
  roomTypeOptions?: string[]
  /** 船舶全部可售房型，用于房型配置勾选 */
  availableRoomTypes?: string[]
}

export default function ProductVoyageConfigPanel({
  tab,
  onTabChange,
  value,
  onChange,
  segmentOptions = [],
  roomTypeOptions = DEFAULT_ROOM_TYPES,
  availableRoomTypes = roomTypeOptions,
}: ProductVoyageConfigPanelProps) {
  const [privilegeOptions, setPrivilegeOptions] = useState<HierarchicalDictOption[]>([])
  const [apSearch, setApSearch] = useState('')
  const [apCategory, setApCategory] = useState('all')
  const defaultSegmentKey = segmentOptions[0]?.key || ''
  const configuredRoomTypes = value.configuredRoomTypes

  useEffect(() => {
    loadHierarchicalDictOptions('PRIVILEGE_TYPE').then(setPrivilegeOptions)
  }, [])

  const toggleConfiguredRoomType = (roomType: string) => {
    const nextConfigured = configuredRoomTypes.includes(roomType)
      ? configuredRoomTypes.filter((item) => item !== roomType)
      : [...configuredRoomTypes, roomType]
    onChange({
      ...value,
      configuredRoomTypes: nextConfigured,
      privileges: value.privileges.filter((item) => nextConfigured.includes(item.roomType)),
      deposits: value.deposits.filter((item) => !item.roomType || nextConfigured.includes(item.roomType)),
      tips: value.tips.filter((item) => !item.roomType || nextConfigured.includes(item.roomType)),
    })
  }

  const updateDep = (idx: number, field: keyof TemplateDeposit, fieldValue: string | number) => {
    const deposits = [...value.deposits]
    deposits[idx] = { ...deposits[idx], [field]: fieldValue }
    onChange({ ...value, deposits })
  }

  const updateTip = (idx: number, patch: Partial<TemplateTip>) => {
    const tips = [...value.tips]
    tips[idx] = { ...tips[idx], ...patch }
    onChange({ ...value, tips })
  }

  const renderSegmentRoomTable = (
    title: string,
    amountLabel: string,
    rows: { id: string; segmentKey: string; roomType: string; amount: number; mandatory?: boolean }[],
    onAdd: () => void,
    onRemove: (id: string) => void,
    onUpdate: (idx: number, patch: { segmentKey?: string; roomType?: string; amount?: number; mandatory?: boolean }) => void,
    showMandatory = false,
  ) => (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h4>
        <button
          type="button"
          onClick={onAdd}
          disabled={segmentOptions.length === 0}
          className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          + 添加规则
        </button>
      </div>
      {segmentOptions.length === 0 ? (
        <p className="text-sm text-gray-500">请先在产品中维护航段信息，再配置航段 × 房型规则。</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left text-xs text-gray-500">航段</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">房型</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">{amountLabel}</th>
              {showMandatory && <th className="px-3 py-2 text-left text-xs text-gray-500">强制收取</th>}
              <th className="w-16 px-3 py-2 text-xs text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => (
              <tr key={row.id}>
                <td className="px-3 py-2">
                  <select
                    value={row.segmentKey}
                    onChange={(event) => onUpdate(idx, { segmentKey: event.target.value })}
                    className="w-full min-w-[140px] rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="">选择航段</option>
                    {segmentOptions.map((seg) => (
                      <option key={seg.key} value={seg.key}>{seg.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.roomType}
                    onChange={(event) => onUpdate(idx, { roomType: event.target.value })}
                    className="w-full min-w-[110px] rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="">选择房型</option>
                    {roomTypeOptions.map((roomType) => (
                      <option key={roomType} value={roomType}>{roomType}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={row.amount || ''}
                    onChange={(event) => onUpdate(idx, { amount: Number(event.target.value) })}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-center text-sm"
                  />
                </td>
                {showMandatory && (
                  <td className="px-3 py-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.mandatory ?? false}
                        onChange={(event) => onUpdate(idx, { mandatory: event.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      {row.mandatory ? '强制' : '可选'}
                    </label>
                  </td>
                )}
                <td className="px-3 py-2">
                  <button type="button" onClick={() => onRemove(row.id)} className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {segmentOptions.length > 0 && (
        <p className="mt-2 text-xs text-gray-400">按航段 × 房型维护；同一航段可配置多个房型规则。</p>
      )}
    </div>
  )

  const renderTab = () => {
    switch (tab) {
      case 0:
        return (
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">房型配置</h4>
            <p className="mb-4 text-sm text-gray-500">从船舶可用房型中选择本产品可售房型；定金、小费与礼遇将基于已选房型维护。</p>
            {availableRoomTypes.length === 0 ? (
              <p className="text-sm text-gray-500">当前船舶暂无可用房型，请先在房型管理中维护。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableRoomTypes.map((roomType) => {
                  const active = configuredRoomTypes.includes(roomType)
                  return (
                    <button
                      key={roomType}
                      type="button"
                      onClick={() => toggleConfiguredRoomType(roomType)}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        active
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {roomType}
                    </button>
                  )
                })}
              </div>
            )}
            {configuredRoomTypes.length > 0 && (
              <p className="mt-3 text-xs text-gray-400">已选 {configuredRoomTypes.length} 个房型：{configuredRoomTypes.join('、')}</p>
            )}
          </div>
        )
      case 1:
        return renderSegmentRoomTable(
          '航次定金',
          '定金(元/人)',
          value.deposits.map((item) => ({
            id: item.id,
            segmentKey: item.segmentKey,
            roomType: item.roomType,
            amount: item.deposit,
          })),
          () => onChange({ ...value, deposits: [...value.deposits, emptyDep(defaultSegmentKey)] }),
          (id) => onChange({ ...value, deposits: value.deposits.filter((item) => item.id !== id) }),
          (idx, patch) => {
            const deposits = [...value.deposits]
            deposits[idx] = {
              ...deposits[idx],
              ...(patch.segmentKey !== undefined ? { segmentKey: patch.segmentKey } : {}),
              ...(patch.roomType !== undefined ? { roomType: patch.roomType } : {}),
              ...(patch.amount !== undefined ? { deposit: patch.amount } : {}),
            }
            onChange({ ...value, deposits })
          },
        )
      case 2:
        return (
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">销售规则</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">预售期规则(天)</label>
                <input type="number" value={value.presaleDays || ''} onChange={(event) => onChange({ ...value, presaleDays: Number(event.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">截止售卖点(天)</label>
                <input type="number" value={value.cutoffDays || ''} onChange={(event) => onChange({ ...value, cutoffDays: Number(event.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">退改策略模板</label>
                <select value={value.refundPolicy} onChange={(event) => onChange({ ...value, refundPolicy: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">选择</option>
                  {refundPolicies.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">物料需求清单</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {materialOptions.map((item) => (
                    <label key={item} className={`cursor-pointer rounded border px-2 py-1 text-xs ${value.materialReq.includes(item) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-600'}`}>
                      <input type="checkbox" checked={value.materialReq.includes(item)} onChange={() => onChange({ ...value, materialReq: toggleArray(value.materialReq, item) })} className="sr-only" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      case 3:
        return renderSegmentRoomTable(
          '小费配置',
          '小费(元/人)',
          value.tips.map((item) => ({
            id: item.id,
            segmentKey: item.segmentKey,
            roomType: item.roomType,
            amount: item.tip,
            mandatory: item.mandatory,
          })),
          () => onChange({ ...value, tips: [...value.tips, emptyTip(defaultSegmentKey)] }),
          (id) => onChange({ ...value, tips: value.tips.filter((item) => item.id !== id) }),
          (idx, patch) => updateTip(idx, {
            ...(patch.segmentKey !== undefined ? { segmentKey: patch.segmentKey } : {}),
            ...(patch.roomType !== undefined ? { roomType: patch.roomType } : {}),
            ...(patch.amount !== undefined ? { tip: patch.amount } : {}),
            ...(patch.mandatory !== undefined ? { mandatory: patch.mandatory } : {}),
          }),
          true,
        )
      case 4:
        return (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">礼遇配置</h4>
              <button
                type="button"
                onClick={() => onChange({
                  ...value,
                  privileges: [...value.privileges, emptyPrivilege(configuredRoomTypes[0] || '')],
                })}
                disabled={configuredRoomTypes.length === 0}
                className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                + 添加礼遇
              </button>
            </div>
            {configuredRoomTypes.length === 0 ? (
              <p className="text-sm text-gray-500">请先在「房型配置」中选择可售房型，再为房型关联礼遇。</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs text-gray-500">房型</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">礼遇</th>
                    <th className="w-16 px-3 py-2 text-xs text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {value.privileges.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-8 text-center text-sm text-gray-400">暂无礼遇配置</td>
                    </tr>
                  ) : value.privileges.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <select
                          value={item.roomType}
                          onChange={(event) => {
                            const privileges = [...value.privileges]
                            privileges[idx] = { ...privileges[idx], roomType: event.target.value }
                            onChange({ ...value, privileges })
                          }}
                          className="w-full min-w-[120px] rounded border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="">选择房型</option>
                          {configuredRoomTypes.map((roomType) => (
                            <option key={roomType} value={roomType}>{roomType}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.privilegeName}
                          onChange={(event) => {
                            const privileges = [...value.privileges]
                            privileges[idx] = { ...privileges[idx], privilegeName: event.target.value }
                            onChange({ ...value, privileges })
                          }}
                          className="w-full min-w-[220px] rounded border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="">选择礼遇</option>
                          {privilegeOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onChange({ ...value, privileges: value.privileges.filter((row) => row.id !== item.id) })}
                          className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-2 text-xs text-gray-400">礼遇项来自分级字典「礼遇类型」，需关联到已配置房型。</p>
          </div>
        )
      case 5: {
        const associatedIds = value.additionalProductIds || []

        const toggleAssociation = (apId: string) => {
          const nextIds = associatedIds.includes(apId)
            ? associatedIds.filter((id) => id !== apId)
            : [...associatedIds, apId]
          onChange({ ...value, additionalProductIds: nextIds })
        }

        const filteredAps = initialAdditionalProducts.filter((item) => {
          const matchKey = !apSearch.trim() || item.name.includes(apSearch.trim()) || (item.externalCode && item.externalCode.includes(apSearch.trim()))
          const matchCat = apCategory === 'all' || item.categoryId === apCategory
          return matchKey && matchCat
        })

        return (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">附加产品配置</h4>
                <p className="mt-1 text-sm text-gray-500">点选附加产品直接为本产品关联/取消关联增值服务、餐食及门票。</p>
              </div>
              <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                已点选关联 <span className="font-bold text-blue-900">{associatedIds.length}</span> 项附加产品
              </div>
            </div>

            {/* 检索过滤面板 */}
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
              <input
                type="text"
                value={apSearch}
                onChange={(e) => setApSearch(e.target.value)}
                placeholder="搜索附加产品名称/编码..."
                className="w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
              />
              <select
                value={apCategory}
                onChange={(e) => setApCategory(e.target.value)}
                className="w-44 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
              >
                <option value="all">全部分类</option>
                {additionalProductCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.level === 2 ? `└ ${c.name}` : c.name}
                  </option>
                ))}
              </select>
              {(apSearch || apCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setApSearch(''); setApCategory('all') }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  清空筛选
                </button>
              )}
            </div>

            {/* 附加产品点选表格 */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="w-12 px-3 py-2 text-center text-xs text-gray-500">勾选</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">附加产品名称</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">产品分类</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">计费方式</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">金额</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">服务来源</th>
                    <th className="w-32 px-3 py-2 text-center text-xs text-gray-500">关联动作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-400">
                        未找到匹配的附加产品
                      </td>
                    </tr>
                  ) : (
                    filteredAps.map((ap) => {
                      const isSelected = associatedIds.includes(ap.id)
                      return (
                        <tr
                          key={ap.id}
                          onClick={() => toggleAssociation(ap.id)}
                          className={`cursor-pointer transition ${
                            isSelected ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAssociation(ap.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {ap.name}
                            {ap.required && (
                              <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-600 font-medium">必选</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500">{getAdditionalCategoryPath(ap.categoryId)}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {ap.chargeMethod === 'per_person' ? '按人计费' : '按房计费'}
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-900">
                            ¥{ap.amount}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500">{ap.sourceName}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleAssociation(ap.id)
                              }}
                              className={`rounded px-3 py-1 text-xs font-medium transition ${
                                isSelected
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {isSelected ? '已关联 ✓' : '+ 点选关联'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2.5 text-xs text-gray-400">点击列表任意整行，或点击右侧操作按钮，即可一键关联该附加产品到本产品。</p>
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex shrink-0 border-b">
        <div className="flex px-6">
          {TABS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => onTabChange(index)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${tab === index ? 'border-gray-900 font-medium text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">{renderTab()}</div>
    </>
  )
}

export { TABS as PRODUCT_VOYAGE_CONFIG_TABS }
