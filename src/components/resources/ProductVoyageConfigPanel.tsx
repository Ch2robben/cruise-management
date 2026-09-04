import { useEffect, useState } from 'react'
import type { ProductPrivilege, TemplateDeposit, TemplateTip } from '@/types'
import { generateId } from '@/utils/format'
import type { HierarchicalDictOption } from '@/utils/hierarchicalDict'
import { loadHierarchicalDictOptions } from '@/utils/hierarchicalDict'
import type { ProductSegmentOption } from '@/utils/productVoyageConfig'
import { initialAdditionalProducts, additionalProductCategories, getAdditionalCategoryPath } from '@/mock/additionalProducts'
import {
  availableDepositRules,
  availablePaymentRules,
  type SalesDepositRule,
  type SalesPaymentRule,
} from '@/mock/salesRules'
import { Building2, UserCheck, ShieldAlert, CheckCircle2, ChevronDown, ChevronRight, Info } from 'lucide-react'

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
  // 定金规则对应项
  depositRuleId?: string
  // 2B 销售配置
  b2bDepositRuleId?: string
  b2bPaymentRuleId?: string
  b2bPresaleDays?: number
  b2bCutoffDays?: number
  b2bRefundPolicy?: string
  // 2C 销售配置
  b2cPaymentRuleId?: string
  b2cPresaleDays?: number
  b2cCutoffDays?: number
  b2cRefundPolicy?: string
}

const TABS = ['房型配置', '定金规则', '销售规则', '小费配置', '礼遇配置', '附加产品'] as const
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
  presaleDays: 90,
  cutoffDays: 3,
  refundPolicy: '标准退改',
  materialReq: ['宣传册', '行程单'],
  additionalProductIds: [],
  depositRuleId: 'dep_default',
  b2bDepositRuleId: 'dep_default',
  b2bPaymentRuleId: 'pay_default',
  b2bPresaleDays: 90,
  b2bCutoffDays: 3,
  b2bRefundPolicy: '标准退改',
  b2cPaymentRuleId: 'pay_c_direct',
  b2cPresaleDays: 60,
  b2cCutoffDays: 1,
  b2cRefundPolicy: '标准退改',
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
  const [salesSubTab, setSalesSubTab] = useState<'2b' | '2c'>('2b')
  const [showSegmentOverrides, setShowSegmentOverrides] = useState(false)

  const defaultSegmentKey = segmentOptions[0]?.key || ''
  const configuredRoomTypes = value.configuredRoomTypes

  // 确保有默认选中的规则ID
  const selectedDepositRuleId = value.depositRuleId || value.b2bDepositRuleId || 'dep_default'
  const selectedB2bPaymentRuleId = value.b2bPaymentRuleId || 'pay_default'
  const selectedB2cPaymentRuleId = value.b2cPaymentRuleId || 'pay_c_direct'

  const currentDepositRule = availableDepositRules.find((r) => r.id === selectedDepositRuleId) || availableDepositRules[0]
  const currentB2bPaymentRule = availablePaymentRules.find((r) => r.id === selectedB2bPaymentRuleId) || availablePaymentRules[0]
  const currentB2cPaymentRule = availablePaymentRules.find((r) => r.id === selectedB2cPaymentRuleId) || availablePaymentRules[2]

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

  const handleDepositRuleChange = (ruleId: string) => {
    onChange({
      ...value,
      depositRuleId: ruleId,
      b2bDepositRuleId: ruleId,
    })
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
        // 定金规则 Tab：选择对应的定金规则
        return (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">定金规则配置</h4>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  选用已有定金规则模型
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                为本产品选定全局定金规则。选定后，2B 渠道分销下单将默认按该规则收取定金与执行超时阻断策略。
              </p>

              {/* 核心：选择已有定金规则 */}
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    选择对应定金规则 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDepositRuleId}
                    onChange={(e) => handleDepositRuleChange(e.target.value)}
                    className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {availableDepositRules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name}（{rule.calculationType === 'fixed' ? `¥${rule.amount}/${rule.dimension}` : `${rule.amount}%比例`} · {rule.deadlineText}）
                      </option>
                    ))}
                  </select>
                </div>

                {/* 所选定金规则详情卡片展示 */}
                {currentDepositRule && (
                  <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-gray-900">{currentDepositRule.name}</span>
                        <span className="text-[11px] rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 font-medium">已启用</span>
                      </div>
                      <span className="text-xs text-gray-400">适用范围：{currentDepositRule.scopeText}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded bg-gray-50 p-2.5">
                        <span className="text-gray-500 block">收取标准</span>
                        <span className="font-semibold text-gray-900 mt-1 block">
                          {currentDepositRule.calculationType === 'fixed'
                            ? `¥${currentDepositRule.amount} / ${currentDepositRule.dimension}`
                            : `${currentDepositRule.amount}% (${currentDepositRule.dimension})`}
                        </span>
                      </div>
                      <div className="rounded bg-gray-50 p-2.5">
                        <span className="text-gray-500 block">收取时机</span>
                        <span className="font-semibold text-gray-900 mt-1 block">{currentDepositRule.paymentTrigger}</span>
                      </div>
                      <div className="rounded bg-gray-50 p-2.5">
                        <span className="text-gray-500 block">支付时限</span>
                        <span className="font-semibold text-gray-900 mt-1 block">{currentDepositRule.deadlineText}</span>
                      </div>
                      <div className="rounded bg-gray-50 p-2.5">
                        <span className="text-gray-500 block">超时动作</span>
                        <span className="font-semibold text-red-600 mt-1 block">{currentDepositRule.overdueAction}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 可选：特定航段×房型定金微调覆盖 */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowSegmentOverrides(!showSegmentOverrides)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  {showSegmentOverrides ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>特定航段 × 房型定金单独覆盖（选填，共 {value.deposits.length} 项）</span>
                </button>
                <span className="text-[11px] text-gray-400">如无特殊需求将直接继承上述全局定金规则</span>
              </div>

              {showSegmentOverrides && (
                <div className="mt-3 rounded-lg border border-gray-200 p-4">
                  {renderSegmentRoomTable(
                    '航段 × 房型覆盖定金',
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
                  )}
                </div>
              )}
            </div>
          </div>
        )
      case 2:
        // 销售规则 Tab：划分为 2B销售 与 2C销售
        return (
          <div className="space-y-4">
            {/* 2B 与 2C 子Tab切换栏 */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
              <button
                type="button"
                onClick={() => setSalesSubTab('2b')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  salesSubTab === '2b'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>2B 销售规则 (分销商/组团社)</span>
              </button>
              <button
                type="button"
                onClick={() => setSalesSubTab('2c')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  salesSubTab === '2c'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>2C 销售规则 (自营散客直销)</span>
              </button>
            </div>

            {/* 2B 销售配置 */}
            {salesSubTab === '2b' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3.5 py-2.5 text-xs text-blue-800 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>2B 销售规则面向签约旅行社、渠道代理商及大客户，支持按定金与船款组合结算模式。</span>
                </div>

                {/* 1. 2B 规则绑定（定金规则与船款规则） */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
                  <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    核心规则绑定（定金与船款）
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 2B 定金规则选择 */}
                    <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/50 space-y-2">
                      <label className="block text-xs font-medium text-gray-700">
                        2B 定金规则 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={value.b2bDepositRuleId || selectedDepositRuleId}
                        onChange={(e) => {
                          onChange({
                            ...value,
                            b2bDepositRuleId: e.target.value,
                            depositRuleId: e.target.value, // 同步全局定金规则
                          })
                        }}
                        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {availableDepositRules.map((rule) => (
                          <option key={rule.id} value={rule.id}>
                            {rule.name}
                          </option>
                        ))}
                      </select>
                      {currentDepositRule && (
                        <div className="text-[11px] text-gray-500 space-y-0.5 pt-1">
                          <div>• 收取标准：<span className="text-gray-800 font-medium">{currentDepositRule.calculationType === 'fixed' ? `¥${currentDepositRule.amount}/${currentDepositRule.dimension}` : `${currentDepositRule.amount}%比例`}</span></div>
                          <div>• 支付时限：<span className="text-gray-800">{currentDepositRule.deadlineText}</span></div>
                          <div>• 超时动作：<span className="text-red-600">{currentDepositRule.overdueAction}</span></div>
                        </div>
                      )}
                    </div>

                    {/* 2B 船款规则选择 */}
                    <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/50 space-y-2">
                      <label className="block text-xs font-medium text-gray-700">
                        2B 船款规则 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedB2bPaymentRuleId}
                        onChange={(e) => onChange({ ...value, b2bPaymentRuleId: e.target.value })}
                        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {availablePaymentRules.map((rule) => (
                          <option key={rule.id} value={rule.id}>
                            {rule.name}
                          </option>
                        ))}
                      </select>
                      {currentB2bPaymentRule && (
                        <div className="text-[11px] text-gray-500 space-y-0.5 pt-1">
                          <div>• 付清时限：<span className="text-gray-800 font-medium">开航前 {currentB2bPaymentRule.deadlineDays} 天付清</span>（提前{currentB2bPaymentRule.collectionStartDays}天催缴）</div>
                          <div>• 定金抵扣：<span className="text-emerald-700">{currentB2bPaymentRule.deductDeposit ? '自动抵扣已收定金' : '不抵扣'}</span></div>
                          <div>• 超时动作：<span className="text-red-600">{currentB2bPaymentRule.overdueActionText}</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. 2B 售卖参数 */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
                  <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    2B 销售参数与物料
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm text-gray-700">预售期规则(天)</label>
                      <input
                        type="number"
                        value={value.b2bPresaleDays ?? value.presaleDays ?? ''}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          onChange({ ...value, b2bPresaleDays: val, presaleDays: val })
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="默认 90 天"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-gray-700">截止售卖点(天)</label>
                      <input
                        type="number"
                        value={value.b2bCutoffDays ?? value.cutoffDays ?? ''}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          onChange({ ...value, b2bCutoffDays: val, cutoffDays: val })
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="默认开航前 3 天截单"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-gray-700">退改策略模板</label>
                      <select
                        value={value.b2bRefundPolicy ?? value.refundPolicy}
                        onChange={(e) => onChange({ ...value, b2bRefundPolicy: e.target.value, refundPolicy: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        {refundPolicies.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-gray-700">物料需求清单</label>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {materialOptions.map((item) => (
                          <label
                            key={item}
                            className={`cursor-pointer rounded border px-2 py-1 text-xs ${
                              value.materialReq.includes(item) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={value.materialReq.includes(item)}
                              onChange={() => onChange({ ...value, materialReq: toggleArray(value.materialReq, item) })}
                              className="sr-only"
                            />
                            {item}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2C 销售配置 */}
            {salesSubTab === '2c' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-3.5 py-2.5 text-xs text-amber-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>2C 直销散客采用即时付清船款模式，无需配置定金规则，仅需选择船款支付与超时取消规则。</span>
                </div>

                {/* 1. 2C 船款规则选择 */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                  <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    2C 船款规则 <span className="text-red-500">*</span>
                  </h5>
                  <div className="max-w-md">
                    <select
                      value={selectedB2cPaymentRuleId}
                      onChange={(e) => onChange({ ...value, b2cPaymentRuleId: e.target.value })}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {availablePaymentRules.map((rule) => (
                        <option key={rule.id} value={rule.id}>
                          {rule.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentB2cPaymentRule && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-xs space-y-1">
                      <div className="font-medium text-gray-900">{currentB2cPaymentRule.name}</div>
                      <div className="text-gray-600">• 付款要求：{currentB2cPaymentRule.lateBookingPolicyText}</div>
                      <div className="text-gray-600">• 超时动作：<span className="text-red-600">{currentB2cPaymentRule.overdueActionText}</span></div>
                      <div className="text-gray-500 text-[11px] pt-1">说明：散客在线选座下单后，需在规定时效内完成线上全额支付，超时未付将自动释放锁定客房。</div>
                    </div>
                  )}
                </div>

                {/* 2. 2C 售卖参数 */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
                  <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    2C 散客售卖控制参数
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm text-gray-700">预售期规则(天)</label>
                      <input
                        type="number"
                        value={value.b2cPresaleDays ?? 60}
                        onChange={(e) => onChange({ ...value, b2cPresaleDays: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="默认 60 天"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-gray-700">截止售卖点(天)</label>
                      <input
                        type="number"
                        value={value.b2cCutoffDays ?? 1}
                        onChange={(e) => onChange({ ...value, b2cCutoffDays: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="默认开航前 1 天截单"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-gray-700">退改策略模板</label>
                      <select
                        value={value.b2cRefundPolicy ?? '标准退改'}
                        onChange={(e) => onChange({ ...value, b2cRefundPolicy: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        {refundPolicies.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

        const filteredAps = initialAdditionalProducts.filter((ap) => {
          const matchesSearch = !apSearch || ap.name.includes(apSearch) || (ap.externalCode || '').includes(apSearch)
          const matchesCategory = apCategory === 'all' || ap.categoryId === apCategory
          return matchesSearch && matchesCategory
        })

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">附加产品管理</h4>
                <p className="mt-1 text-sm text-gray-500">点选勾选要关联到当前产品的附加消费项（餐饮包、VIP包厢、讲解等）。</p>
              </div>
              <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-medium">
                已关联 {associatedIds.length} 项附加产品
              </span>
            </div>

            {/* 搜索与分类筛选栏 */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="搜索附加产品名称 / 编号..."
                value={apSearch}
                onChange={(e) => setApSearch(e.target.value)}
                className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
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
              className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
                tab === index ? 'border-gray-900 font-medium text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
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
