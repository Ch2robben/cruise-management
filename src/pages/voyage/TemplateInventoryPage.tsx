import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Pencil, X } from 'lucide-react'
import { dealers, products, ships, voyageInventories, voyageTemplates } from '@/mock/data'
import type { Product, ProductSegment, VoyageTemplate } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'

interface TemplateInventoryCell {
  physicalCapacity: number
  onlineRetail: number
  sharedStock: number
  dedicatedStock: number
}

type SegmentConfig = Record<string, TemplateInventoryCell>
type TemplateConfig = Record<string, SegmentConfig>
type ConfigByTemplate = Record<string, TemplateConfig>
type EditableInventoryField = 'onlineRetail' | 'sharedStock'

interface DedicatedWarehouseAllocation {
  dealerId: string
  availableQuantity: number
}

type DedicatedWarehouseConfigByTemplate = Record<string, DedicatedWarehouseAllocation[]>

interface DialogState {
  mode: 'view' | 'edit'
  template: VoyageTemplate
  draft: TemplateConfig
}

interface DedicatedWarehouseDialogState {
  template: VoyageTemplate
  dealerDraft: DedicatedWarehouseAllocation[]
}

const directionLabels: Record<string, string> = { upstream: '上水', downstream: '下水' }
const cabinTypeLabels: Record<string, string> = { suite: '套房', balcony: '阳台房', window: '海景房', inside: '内舱房' }

const segmentKey = (segment: ProductSegment) => `${segment.startPort}-${segment.endPort}`

function getProduct(template: VoyageTemplate) {
  return products.find(product => product.id === template.productId)
}

function getTemplateDirection(template: VoyageTemplate) {
  const product = getProduct(template)
  return product ? directionLabels[product.routeType] : '-'
}

function getCabinNames(template: VoyageTemplate, product?: Product) {
  const names = new Set<string>()
  template.inventory.forEach(item => names.add(item.cabinName))
  product?.pricing.forEach(item => names.add(item.cabinType))
  const ship = ships.find(item => item.name === template.shipName)
  ship?.cabinTypes.forEach(item => names.add(cabinTypeLabels[item] || item))
  return Array.from(names)
}

function getPhysicalCapacity(template: VoyageTemplate, cabinName: string) {
  const inventory = voyageInventories.find(item => item.shipName === template.shipName && item.cabinTypeName === cabinName)
  if (inventory) return inventory.physicalCapacity
  return 0
}

function createTemplateConfig(template: VoyageTemplate, seed = false): TemplateConfig {
  const product = getProduct(template)
  const config: TemplateConfig = {}
  getCabinNames(template, product).forEach((cabinName, cabinIndex) => {
    config[cabinName] = {}
    product?.segments.forEach((segment, segmentIndex) => {
      const physicalCapacity = getPhysicalCapacity(template, cabinName)
      const base = seed ? Math.max(0, physicalCapacity - segmentIndex - cabinIndex * 2) : 0
      config[cabinName][segmentKey(segment)] = {
        physicalCapacity,
        onlineRetail: seed ? Math.floor(base * 0.45) : 0,
        sharedStock: seed ? Math.floor(base * 0.35) : 0,
        dedicatedStock: seed ? Math.max(0, base - Math.floor(base * 0.45) - Math.floor(base * 0.35)) : 0,
      }
    })
  })
  return config
}

function createInitialConfigs(): ConfigByTemplate {
  return {
    vt01: createTemplateConfig(voyageTemplates[0], true),
    vt04: createTemplateConfig(voyageTemplates[3], true),
  }
}

function createDefaultDedicatedWarehouseAllocations(): DedicatedWarehouseAllocation[] {
  return dealers
    .filter(dealer => dealer.status === 'cooperating')
    .slice(0, 3)
    .map((dealer, index) => ({
      dealerId: dealer.id,
      availableQuantity: 20 + index * 10,
    }))
}

function createInitialDedicatedWarehouseConfigs(): DedicatedWarehouseConfigByTemplate {
  return {
    vt01: createDefaultDedicatedWarehouseAllocations(),
    vt04: createDefaultDedicatedWarehouseAllocations(),
  }
}

function summarize(config?: TemplateConfig) {
  if (!config) return null
  let totalAvailable = 0
  let onlineRetail = 0
  let sharedStock = 0
  let dedicatedStock = 0

  Object.values(config).forEach(segmentConfig => {
    Object.values(segmentConfig).forEach(cell => {
      onlineRetail += cell.onlineRetail
      sharedStock += cell.sharedStock
      dedicatedStock += cell.dedicatedStock
    })
  })
  totalAvailable = onlineRetail + sharedStock + dedicatedStock
  return { totalAvailable, onlineRetail, sharedStock, dedicatedStock }
}

function numberOrZero(value: string) {
  const next = Number(value)
  return Number.isFinite(next) && next >= 0 ? next : 0
}

export default function TemplateInventoryPage() {
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('templateId')
  const [configs, setConfigs] = useState<ConfigByTemplate>(() => createInitialConfigs())
  const [dedicatedWarehouseConfigs, setDedicatedWarehouseConfigs] = useState<DedicatedWarehouseConfigByTemplate>(() => createInitialDedicatedWarehouseConfigs())
  const [keyword, setKeyword] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [shipFilter, setShipFilter] = useState('all')
  const [sailTypeFilter, setSailTypeFilter] = useState('all')
  const [dealerDropdownOpen, setDealerDropdownOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({
    keyword: '',
    productFilter: 'all',
    shipFilter: 'all',
    sailTypeFilter: 'all',
  })
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [dedicatedWarehouseDialog, setDedicatedWarehouseDialog] = useState<DedicatedWarehouseDialogState | null>(null)
  const [autoOpenedTemplateId, setAutoOpenedTemplateId] = useState<string | null>(null)

  useEffect(() => {
    if (!templateId || autoOpenedTemplateId === templateId) return
    const template = voyageTemplates.find(item => item.id === templateId)
    if (!template) return
    setDialog({
      mode: 'edit',
      template,
      draft: structuredClone(configs[template.id] || createTemplateConfig(template)),
    })
    setAutoOpenedTemplateId(templateId)
  }, [autoOpenedTemplateId, configs, templateId])

  const filteredTemplates = useMemo(() => {
    const kw = appliedFilters.keyword.trim().toLowerCase()
    return voyageTemplates.filter(template => {
      if (kw && !template.name.toLowerCase().includes(kw)) return false
      if (appliedFilters.productFilter !== 'all' && template.productId !== appliedFilters.productFilter) return false
      if (appliedFilters.shipFilter !== 'all' && template.shipName !== appliedFilters.shipFilter) return false
      if (appliedFilters.sailTypeFilter !== 'all' && template.sailType !== appliedFilters.sailTypeFilter) return false
      return true
    })
  }, [appliedFilters])

  const handleSearch = () => {
    setAppliedFilters({ keyword, productFilter, shipFilter, sailTypeFilter })
  }

  const handleReset = () => {
    setKeyword('')
    setProductFilter('all')
    setShipFilter('all')
    setSailTypeFilter('all')
    setAppliedFilters({ keyword: '', productFilter: 'all', shipFilter: 'all', sailTypeFilter: 'all' })
  }

  const openDialog = (template: VoyageTemplate, mode: 'view' | 'edit') => {
    setDialog({
      mode,
      template,
      draft: structuredClone(configs[template.id] || createTemplateConfig(template)),
    })
  }

  const updateCell = (cabinName: string, key: string, field: EditableInventoryField, value: string) => {
    if (!dialog || dialog.mode === 'view') return
    setDialog({
      ...dialog,
      draft: {
        ...dialog.draft,
        [cabinName]: {
          ...dialog.draft[cabinName],
          [key]: {
            ...dialog.draft[cabinName][key],
            [field]: numberOrZero(value),
          },
        },
      },
    })
  }

  const handleSave = () => {
    if (!dialog) return
    setConfigs(prev => ({ ...prev, [dialog.template.id]: dialog.draft }))
    setDialog(null)
  }

  const openDedicatedWarehouseDialog = (template: VoyageTemplate) => {
    setDedicatedWarehouseDialog({
      template,
      dealerDraft: structuredClone(dedicatedWarehouseConfigs[template.id] || []),
    })
    setDealerDropdownOpen(false)
  }

  const saveDedicatedWarehouseConfig = () => {
    if (!dedicatedWarehouseDialog) return
    setDedicatedWarehouseConfigs(prev => ({ ...prev, [dedicatedWarehouseDialog.template.id]: dedicatedWarehouseDialog.dealerDraft }))
    setDedicatedWarehouseDialog(null)
  }

  const toggleDealerSelection = (dealerId: string) => {
    if (!dedicatedWarehouseDialog) return
    const selected = dedicatedWarehouseDialog.dealerDraft.some(item => item.dealerId === dealerId)
    setDedicatedWarehouseDialog({
      ...dedicatedWarehouseDialog,
      dealerDraft: selected
        ? dedicatedWarehouseDialog.dealerDraft.filter(item => item.dealerId !== dealerId)
        : [...dedicatedWarehouseDialog.dealerDraft, { dealerId, availableQuantity: 0 }],
    })
  }

  const updateDealerAvailableQuantity = (dealerId: string, value: string) => {
    if (!dedicatedWarehouseDialog) return
    setDedicatedWarehouseDialog({
      ...dedicatedWarehouseDialog,
      dealerDraft: dedicatedWarehouseDialog.dealerDraft.map(item => item.dealerId === dealerId ? { ...item, availableQuantity: numberOrZero(value) } : item),
    })
  }

  const renderSummaryValue = (value?: number) => {
    if (value === undefined) return <span className="text-blue-600 font-medium">配置</span>
    return <span className="font-semibold text-gray-900">{value}</span>
  }

  const dialogProduct = dialog ? getProduct(dialog.template) : undefined
  const dialogSegments = dialogProduct?.segments || []
  const dialogCabinNames = dialog ? getCabinNames(dialog.template, dialogProduct) : []
  const readonly = dialog?.mode === 'view'
  const activeDealers = dealers.filter(dealer => dealer.status === 'cooperating')
  const selectedDealerNames = dedicatedWarehouseDialog?.dealerDraft
    .map(item => activeDealers.find(dealer => dealer.id === item.dealerId)?.name)
    .filter(Boolean)
    .join('、')

  return (
    <div>
      <PageHeader title="航次模板库存管理" description="按航次模板配置各航段、各舱房类型的线上散客和共享库存，专仓库存仅汇总展示。" />

      <SearchPanel onSearch={handleSearch} onReset={handleReset}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">模板名称</label>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索模板名称" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关联产品</label>
          <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)} className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">适用游轮</label>
          <select value={shipFilter} onChange={(event) => setShipFilter(event.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {ships.map(ship => <option key={ship.id} value={ship.name}>{ship.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">开航类型</label>
          <select value={sailTypeFilter} onChange={(event) => setSailTypeFilter(event.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            <option value="周内固定">周内固定</option>
            <option value="周期循环">周期循环</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['产品名', '模板名', '适用游轮', '开航类型', '总可售', '线上散客', '共享库存', '专仓', '操作'].map(title => (
                  <th key={title} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">{title}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTemplates.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
              ) : filteredTemplates.map(template => {
                const summary = summarize(configs[template.id])
                return (
                  <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{template.productName}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{template.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{template.shipName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{template.sailType}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderSummaryValue(summary?.totalAvailable)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderSummaryValue(summary?.onlineRetail)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderSummaryValue(summary?.sharedStock)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{renderSummaryValue(summary?.dedicatedStock)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDialog(template, 'view')} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"><Eye className="w-3 h-3" />查看</button>
                        <button onClick={() => openDialog(template, 'edit')} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-3 h-3" />编辑</button>
                        <button onClick={() => openDedicatedWarehouseDialog(template)} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 rounded">专仓配置</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
          <span>共 {filteredTemplates.length} 条</span>
          <span>未编辑模板库存时，库存字段显示为「配置」。</span>
        </div>
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[4vh]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDialog(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{readonly ? '查看模板库存' : '编辑模板库存'}</h3>
                <p className="text-xs text-gray-500 mt-1">按产品航段维护库存分配，物理容量和专仓库存为只读参考值。</p>
              </div>
              <button onClick={() => setDialog(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button>
            </div>

            <div className="px-6 py-4 border-b bg-gray-50/60 shrink-0">
              <div className="grid grid-cols-4 gap-3">
                <ReadonlyField label="产品名称" value={dialog.template.productName} />
                <ReadonlyField label="模板名称" value={dialog.template.name} />
                <ReadonlyField label="适用游轮" value={dialog.template.shipName} />
                <ReadonlyField label="开航类型" value={`${dialog.template.sailType} · ${getTemplateDirection(dialog.template)}`} />
              </div>
            </div>

            <div className="flex-1 overflow-auto px-6 py-4">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 px-3 py-3 text-left text-xs font-medium text-gray-600 w-28">舱房类型</th>
                    {dialogSegments.map(segment => (
                      <th key={segment.id} className="border-b border-r border-gray-200 px-3 py-3 text-left text-xs font-medium text-gray-600 min-w-[260px]">
                        <div className="font-semibold text-gray-800">{segmentKey(segment)}</div>
                        <div className="mt-1 text-gray-400">{segment.days}天 · {segment.mileage}km</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dialogCabinNames.map(cabinName => (
                    <tr key={cabinName} className="align-top">
                      <td className="sticky left-0 z-10 bg-white border-r border-b border-gray-200 px-3 py-4 font-medium text-gray-900">{cabinName}</td>
                      {dialogSegments.map(segment => {
                        const key = segmentKey(segment)
                        const cell = dialog.draft[cabinName]?.[key] || { physicalCapacity: 0, onlineRetail: 0, sharedStock: 0, dedicatedStock: 0 }
                        return (
                          <td key={key} className="border-r border-b border-gray-200 p-3">
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <InventoryInput label="物理容量" value={cell.physicalCapacity} readonly />
                                <InventoryInput label="专仓" value={cell.dedicatedStock} readonly />
                              </div>
                              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2">
                                <InventoryInput label="线上散客" value={cell.onlineRetail} readonly={readonly} onChange={(value) => updateCell(cabinName, key, 'onlineRetail', value)} />
                                <InventoryInput label="共享库存" value={cell.sharedStock} readonly={readonly} onChange={(value) => updateCell(cabinName, key, 'sharedStock', value)} />
                              </div>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
              <button onClick={() => setDialog(null)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
              {!readonly && <button onClick={handleSave} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">保存</button>}
            </div>
          </div>
        </div>
      )}

      {dedicatedWarehouseDialog && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDedicatedWarehouseDialog(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-900">专仓配置</h3>
                <p className="text-xs text-gray-500 mt-1">选择分销商后生成专仓可售数量表，维护该模板下各分销商的专仓可售数量。</p>
              </div>
              <button onClick={() => setDedicatedWarehouseDialog(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button>
            </div>

            <div className="px-6 py-4 border-b bg-gray-50/60 shrink-0">
              <div className="grid grid-cols-4 gap-3">
                <ReadonlyField label="产品名称" value={dedicatedWarehouseDialog.template.productName} />
                <ReadonlyField label="模板名称" value={dedicatedWarehouseDialog.template.name} />
                <ReadonlyField label="适用游轮" value={dedicatedWarehouseDialog.template.shipName} />
                <ReadonlyField label="开航类型" value={`${dedicatedWarehouseDialog.template.sailType} · ${getTemplateDirection(dedicatedWarehouseDialog.template)}`} />
              </div>
            </div>

            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="mb-4 flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">分销商下拉多选框</h4>
                  <p className="mt-1 text-xs text-gray-500">选择完成后，下方表格会按所选分销商生成行。</p>
                </div>
                <div className="relative w-96">
                  <button
                    type="button"
                    onClick={() => setDealerDropdownOpen(open => !open)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="block truncate">{selectedDealerNames || '请选择分销商'}</span>
                  </button>
                  {dealerDropdownOpen && (
                    <div className="absolute right-0 z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                      {activeDealers.map(dealer => {
                        const checked = dedicatedWarehouseDialog.dealerDraft.some(item => item.dealerId === dealer.id)
                        return (
                          <label key={dealer.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <input type="checkbox" checked={checked} onChange={() => toggleDealerSelection(dealer.id)} className="h-4 w-4 rounded border-gray-300 text-gray-900" />
                            <span className="truncate">{dealer.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <table className="min-w-full border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-r border-gray-200 px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">分销商名</th>
                    <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">可售数量</th>
                  </tr>
                </thead>
                <tbody>
                  {dedicatedWarehouseDialog.dealerDraft.length === 0 ? (
                    <tr><td colSpan={2} className="px-4 py-10 text-center text-sm text-gray-400">请选择分销商后生成表格</td></tr>
                  ) : dedicatedWarehouseDialog.dealerDraft.map(item => {
                    const dealer = activeDealers.find(activeDealer => activeDealer.id === item.dealerId)
                    return (
                      <tr key={item.dealerId}>
                        <td className="border-r border-b border-gray-200 px-3 py-3 text-sm text-gray-900">{dealer?.name || item.dealerId}</td>
                        <td className="border-b border-gray-200 px-3 py-3">
                          <input
                            type="number"
                            min={0}
                            value={item.availableQuantity}
                            onChange={(event) => updateDealerAvailableQuantity(item.dealerId, event.target.value)}
                            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
              <button onClick={() => setDedicatedWarehouseDialog(null)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={saveDedicatedWarehouseConfig} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input value={value} disabled className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg text-sm text-gray-600" />
    </div>
  )
}

function InventoryInput({ label, value, readonly, onChange }: { label: string; value: number; readonly: boolean; onChange?: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-gray-500 mb-1">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        disabled={readonly}
        onChange={(event) => onChange?.(event.target.value)}
        className={`w-full px-2 py-1.5 border rounded text-sm text-center ${readonly ? 'border-gray-200 bg-gray-100 text-gray-500' : 'border-gray-300 bg-white text-gray-900'}`}
      />
    </label>
  )
}
