import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, Info } from 'lucide-react'
import FormDialog from '@/components/common/FormDialog'
import {
  distributionGroups,
  initialDistributionPrices,
  type DistributionPriceItem,
  type DistributionProductType,
  type DistributionScopeOption,
} from '@/mock/distributionPricing'

type ProductTypeFilter = '全部' | DistributionProductType
type StatusFilter = '全部' | '已开启' | '已关闭'
type ScopeField = 'segments' | 'voyages'

interface PriceFilters {
  productType: ProductTypeFilter
  productName: string
  routeName: string
  status: StatusFilter
}

interface ExpandableMultiSelectProps {
  rowLabel: string
  label: '航段' | '航次'
  options: DistributionScopeOption[]
  expanded: boolean
  onToggleExpanded: () => void
  onToggleAll: () => void
  onToggleOption: (optionId: string) => void
}

const productTypes: ProductTypeFilter[] = ['全部', '游船产品', '期票产品', '套票产品', '附加产品']
const defaultFilters: PriceFilters = { productType: '游船产品', productName: '全部', routeName: '全部', status: '全部' }

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`mt-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function ExpandableMultiSelect({ rowLabel, label, options, expanded, onToggleExpanded, onToggleAll, onToggleOption }: ExpandableMultiSelectProps) {
  if (options.length === 0) return <span className="text-gray-400">-</span>

  const selectedCount = options.filter(option => option.selected).length
  const allSelected = selectedCount === options.length
  const summary = selectedCount === 0
    ? `未选择${label}`
    : allSelected
      ? `全部 ${options.length} 个${label}`
      : `已选 ${selectedCount}/${options.length} 个${label}`

  return (
    <div className="min-w-[230px]">
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? '收起' : '展开'} ${rowLabel} ${label}`}
        onClick={onToggleExpanded}
        className="flex w-full items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50"
      >
        <span>{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-2 rounded-md border border-gray-200 bg-white p-2 shadow-sm">
          <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 font-medium text-gray-700 hover:bg-gray-50">
            <input
              type="checkbox"
              aria-label={`全选 ${rowLabel} ${label}`}
              checked={allSelected}
              onChange={onToggleAll}
            />
            <span>全选（{options.length}）</span>
          </label>
          <div className="my-1 border-t border-gray-100" />
          {options.map(option => (
            <label key={option.id} className="flex cursor-pointer items-start gap-2 rounded px-2 py-2 text-gray-700 hover:bg-gray-50">
              <input
                type="checkbox"
                aria-label={`${rowLabel} ${label} ${option.name}`}
                checked={option.selected}
                onChange={() => onToggleOption(option.id)}
                className="mt-0.5"
              />
              <span className="leading-5">{option.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DistributionPriceConfigPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()
  const group = distributionGroups.find(item => item.id === groupId) ?? distributionGroups[0]
  const [rows, setRows] = useState<DistributionPriceItem[]>(initialDistributionPrices)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({})
  const [viewingRowId, setViewingRowId] = useState<string | null>(null)
  const [productType, setProductType] = useState<ProductTypeFilter>(defaultFilters.productType)
  const [productName, setProductName] = useState(defaultFilters.productName)
  const [routeName, setRouteName] = useState(defaultFilters.routeName)
  const [status, setStatus] = useState<StatusFilter>(defaultFilters.status)
  const [filters, setFilters] = useState<PriceFilters>(defaultFilters)
  const [toast, setToast] = useState('')

  const showCruiseScope = productType === '游船产品'
  const productOptions = useMemo(() => unique(rows.filter(row => productType === '全部' || row.productType === productType).map(row => row.productName)), [rows, productType])
  const routeOptions = useMemo(() => unique(rows.filter(row => row.productType === '游船产品' && (productName === '全部' || row.productName === productName)).map(row => row.routeName)), [rows, productName])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  const filteredRows = useMemo(() => rows.filter(row => {
    if (filters.productType !== '全部' && row.productType !== filters.productType) return false
    if (filters.productName !== '全部' && row.productName !== filters.productName) return false
    if (filters.productType === '游船产品' && filters.routeName !== '全部' && row.routeName !== filters.routeName) return false
    if (filters.status === '已开启' && !row.saleEnabled) return false
    if (filters.status === '已关闭' && row.saleEnabled) return false
    return true
  }), [rows, filters])

  const visibleIds = filteredRows.map(row => row.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id))
  const viewingRow = rows.find(row => row.id === viewingRowId)

  const changeProductType = (nextType: ProductTypeFilter) => {
    setProductType(nextType)
    setProductName('全部')
    setRouteName('全部')
  }

  const changeProduct = (nextProduct: string) => {
    setProductName(nextProduct)
    setRouteName('全部')
  }

  const applySearch = () => {
    setFilters({ productType, productName, routeName, status })
    setSelectedIds([])
    setExpandedCells({})
  }

  const resetSearch = () => {
    setProductType(defaultFilters.productType)
    setProductName(defaultFilters.productName)
    setRouteName(defaultFilters.routeName)
    setStatus(defaultFilters.status)
    setFilters(defaultFilters)
    setSelectedIds([])
    setExpandedCells({})
  }

  const bulkSetSale = (saleEnabled: boolean) => {
    if (selectedIds.length === 0) {
      showToast('请先选择需要操作的产品航线')
      return
    }
    setRows(previous => previous.map(row => selectedIds.includes(row.id) ? { ...row, saleEnabled } : row))
    showToast(saleEnabled ? `已开启 ${selectedIds.length} 项分销` : `已关闭 ${selectedIds.length} 项分销`)
  }

  const toggleExpanded = (rowId: string, field: ScopeField) => {
    const key = `${rowId}:${field}`
    setExpandedCells(previous => ({ ...previous, [key]: !previous[key] }))
  }

  const toggleScopeOption = (rowId: string, field: ScopeField, optionId: string) => {
    setRows(previous => previous.map(row => row.id === rowId
      ? { ...row, [field]: row[field].map(option => option.id === optionId ? { ...option, selected: !option.selected } : option) }
      : row))
  }

  const toggleAllScopeOptions = (rowId: string, field: ScopeField) => {
    setRows(previous => previous.map(row => {
      if (row.id !== rowId) return row
      const allSelected = row[field].every(option => option.selected)
      return { ...row, [field]: row[field].map(option => ({ ...option, selected: !allSelected })) }
    }))
  }

  return (
    <div>
      {toast && <div className="fixed left-1/2 top-6 z-[999] -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-semibold text-gray-900">正在给“<span className="text-blue-600">{group.name}</span>”配置可售范围</h2>
          <p className="mt-2 text-sm text-gray-500">游船产品按产品、航线配置，并选择具体可售航段与航次；其他产品按产品维度配置。</p>
        </div>
        <button type="button" onClick={() => navigate('/distribution-management')} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">返回分销管理</button>
      </div>

      <div className="mb-5 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>关闭后，该分组下的分销商将不能销售对应产品航线；开启后，仅勾选的航段和航次可售。</span>
      </div>

      <div className="bg-white">
        <div className="border-b border-gray-200 px-6 py-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800">配置范围</h3>
            <p className="mt-1 text-xs text-gray-500">先筛选产品和航线，再在列表的航段、航次单元格内展开并勾选可售范围。</p>
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <label className="space-y-2">
              <span className="block text-sm text-gray-700">产品类型</span>
              <select value={productType} onChange={event => changeProductType(event.target.value as ProductTypeFilter)} className="h-10 min-w-36 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {productTypes.map(type => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="block text-sm text-gray-700">产品</span>
              <select value={productName} onChange={event => changeProduct(event.target.value)} className="h-10 min-w-44 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="全部">全部产品</option>
                {productOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
            {showCruiseScope && (
              <label className="space-y-2">
                <span className="block text-sm text-gray-700">航线</span>
                <select value={routeName} disabled={productName === '全部'} onChange={event => setRouteName(event.target.value)} className="h-10 min-w-44 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400">
                  <option value="全部">{productName === '全部' ? '请先选择产品' : '全部航线'}</option>
                  {routeOptions.map(option => <option key={option}>{option}</option>)}
                </select>
              </label>
            )}
            <label className="space-y-2">
              <span className="block text-sm text-gray-700">状态</span>
              <select value={status} onChange={event => setStatus(event.target.value as StatusFilter)} className="h-10 min-w-32 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>全部</option><option>已开启</option><option>已关闭</option>
              </select>
            </label>
            <div className="flex items-center gap-3 pb-0.5">
              <button type="button" onClick={applySearch} className="h-10 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700">搜索</button>
              <button type="button" onClick={resetSearch} className="h-10 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-700 hover:bg-gray-50">重置</button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4">
          <button type="button" onClick={() => bulkSetSale(true)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">开启分销</button>
          <button type="button" onClick={() => bulkSetSale(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">关闭分销</button>
          <span className="text-sm text-gray-500">已选择 {selectedIds.length} 项</span>
        </div>

        <div className="overflow-x-auto border-y border-gray-200">
          <table className="w-full min-w-[1220px] text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="w-12 px-4 py-3 text-center"><input aria-label="选择全部当前结果" type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedIds(previous => allVisibleSelected ? previous.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...previous, ...visibleIds])))} /></th>
                <th className="px-4 py-3 text-left font-medium">产品</th>
                <th className="px-4 py-3 text-left font-medium">航线</th>
                <th className="w-[280px] px-4 py-3 text-left font-medium">航段</th>
                <th className="w-[310px] px-4 py-3 text-left font-medium">航次</th>
                <th className="px-4 py-3 text-center font-medium">是否可售</th>
                <th className="px-4 py-3 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400">暂无匹配的可售范围配置</td></tr>
              ) : filteredRows.map(row => {
                const rowLabel = `${row.productName} ${row.routeName || ''}`.trim()
                return (
                  <tr key={row.id} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-4 text-center"><input aria-label={`选择 ${rowLabel}`} type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => setSelectedIds(previous => previous.includes(row.id) ? previous.filter(id => id !== row.id) : [...previous, row.id])} /></td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{row.productName}</div>
                      <div className="mt-1 text-xs text-gray-400">{row.productType}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{row.routeName || '-'}</td>
                    <td className="px-4 py-4 text-gray-700">
                      <ExpandableMultiSelect
                        rowLabel={rowLabel}
                        label="航段"
                        options={row.segments}
                        expanded={Boolean(expandedCells[`${row.id}:segments`])}
                        onToggleExpanded={() => toggleExpanded(row.id, 'segments')}
                        onToggleAll={() => toggleAllScopeOptions(row.id, 'segments')}
                        onToggleOption={optionId => toggleScopeOption(row.id, 'segments', optionId)}
                      />
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      <ExpandableMultiSelect
                        rowLabel={rowLabel}
                        label="航次"
                        options={row.voyages}
                        expanded={Boolean(expandedCells[`${row.id}:voyages`])}
                        onToggleExpanded={() => toggleExpanded(row.id, 'voyages')}
                        onToggleAll={() => toggleAllScopeOptions(row.id, 'voyages')}
                        onToggleOption={optionId => toggleScopeOption(row.id, 'voyages', optionId)}
                      />
                    </td>
                    <td className="px-4 py-4 text-center"><Toggle checked={row.saleEnabled} label={`${rowLabel} 是否可售`} onChange={() => setRows(previous => previous.map(item => item.id === row.id ? { ...item, saleEnabled: !item.saleEnabled } : item))} /></td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <button type="button" onClick={() => setViewingRowId(row.id)} className="text-sm text-blue-600 hover:text-blue-700">查看可售范围</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-6">
          <button type="button" onClick={() => navigate('/distribution-management')} className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50">取消</button>
          <button type="button" onClick={() => showToast('可售范围保存成功')} className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">保存</button>
        </div>
      </div>

      <FormDialog
        open={Boolean(viewingRow)}
        title="查看可售范围"
        width="max-w-2xl"
        onCancel={() => setViewingRowId(null)}
      >
        {viewingRow && (
          <div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div><dt className="text-gray-500">产品类型</dt><dd className="mt-1 text-gray-900">{viewingRow.productType}</dd></div>
              <div><dt className="text-gray-500">产品</dt><dd className="mt-1 text-gray-900">{viewingRow.productName}</dd></div>
              <div><dt className="text-gray-500">航线</dt><dd className="mt-1 text-gray-900">{viewingRow.routeName || '-'}</dd></div>
              <div><dt className="text-gray-500">是否可售</dt><dd className="mt-1 text-gray-900">{viewingRow.saleEnabled ? '已开启' : '已关闭'}</dd></div>
            </dl>

            {viewingRow.productType === '游船产品' ? (
              <div className="mt-6 grid grid-cols-2 gap-6 border-t border-gray-200 pt-5">
                <section>
                  <h4 className="text-sm font-semibold text-gray-900">已选航段（{viewingRow.segments.filter(option => option.selected).length}）</h4>
                  <ul className="mt-3 space-y-2">
                    {viewingRow.segments.filter(option => option.selected).map(option => (
                      <li key={option.id} className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">{option.name}</li>
                    ))}
                    {viewingRow.segments.every(option => !option.selected) && <li className="py-3 text-sm text-gray-400">暂未选择航段</li>}
                  </ul>
                </section>
                <section>
                  <h4 className="text-sm font-semibold text-gray-900">已选航次（{viewingRow.voyages.filter(option => option.selected).length}）</h4>
                  <ul className="mt-3 space-y-2">
                    {viewingRow.voyages.filter(option => option.selected).map(option => (
                      <li key={option.id} className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">{option.name}</li>
                    ))}
                    {viewingRow.voyages.every(option => !option.selected) && <li className="py-3 text-sm text-gray-400">暂未选择航次</li>}
                  </ul>
                </section>
              </div>
            ) : (
              <p className="mt-6 border-t border-gray-200 pt-5 text-sm text-gray-500">该产品类型按产品维度配置，无需选择航段和航次。</p>
            )}

            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
              <button type="button" onClick={() => setViewingRowId(null)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">关闭</button>
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  )
}
