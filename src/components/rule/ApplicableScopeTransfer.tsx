import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { products, voyages } from '@/mock/data'
import { formatDate } from '@/utils/format'

export interface ApplicableScope {
  productIds: string[]
  voyageIds: string[]
}

interface ApplicableScopeTransferProps {
  value: ApplicableScope
  onChange: (value: ApplicableScope) => void
}

export const emptyApplicableScope: ApplicableScope = {
  productIds: [],
  voyageIds: [],
}

export function createDefaultApplicableScope(): ApplicableScope {
  const firstProduct = products[0]
  if (!firstProduct) return emptyApplicableScope
  const productVoyages = voyages.filter((voyage) => voyage.productId === firstProduct.id).map((voyage) => voyage.id)
  return {
    productIds: [firstProduct.id],
    voyageIds: productVoyages,
  }
}

export function normalizeApplicableScope(scope?: ApplicableScope): ApplicableScope {
  return {
    productIds: scope?.productIds || [],
    voyageIds: scope?.voyageIds || [],
  }
}

export function formatApplicableScope(scope?: ApplicableScope) {
  const safeScope = normalizeApplicableScope(scope)
  if (safeScope.productIds.length === 0 && safeScope.voyageIds.length === 0) return '未配置'
  return `${safeScope.productIds.length}个产品 / ${safeScope.voyageIds.length}个航次`
}

export function formatApplicableScopeDetail(scope?: ApplicableScope) {
  const safeScope = normalizeApplicableScope(scope)
  if (safeScope.productIds.length === 0 && safeScope.voyageIds.length === 0) return '未配置'

  return safeScope.productIds.map((productId) => {
    const product = products.find((item) => item.id === productId)
    const selectedVoyages = voyages.filter((voyage) => voyage.productId === productId && safeScope.voyageIds.includes(voyage.id))
    if (!product) return ''
    if (selectedVoyages.length === 0) return `${product.name}：未选择航次`
    return `${product.name}：${selectedVoyages.map((voyage) => `${voyage.voyageNo}(${formatDate(voyage.startDate)})`).join('、')}`
  }).filter(Boolean).join('\n')
}

export function scopeIncludesProduct(scope: ApplicableScope | undefined, productId: string) {
  return normalizeApplicableScope(scope).productIds.includes(productId)
}

export default function ApplicableScopeTransfer({ value, onChange }: ApplicableScopeTransferProps) {
  const safeValue = normalizeApplicableScope(value)
  const [pendingAddIds, setPendingAddIds] = useState<string[]>([])
  const [pendingRemoveIds, setPendingRemoveIds] = useState<string[]>([])

  const availableVoyageIds = useMemo(() => (
    voyages.filter((voyage) => !safeValue.voyageIds.includes(voyage.id)).map((voyage) => voyage.id)
  ), [safeValue.voyageIds])

  const selectedVoyages = useMemo(() => (
    voyages.filter((voyage) => safeValue.voyageIds.includes(voyage.id))
  ), [safeValue.voyageIds])

  const updateScope = (nextVoyageIds: string[]) => {
    const nextProductIds = products
      .filter((product) => nextVoyageIds.some((voyageId) => voyages.find((voyage) => voyage.id === voyageId)?.productId === product.id))
      .map((product) => product.id)

    onChange({
      voyageIds: Array.from(new Set(nextVoyageIds)),
      productIds: nextProductIds,
    })
  }

  const togglePendingAddProduct = (productId: string) => {
    const productVoyageIds = voyages
      .filter((voyage) => voyage.productId === productId && availableVoyageIds.includes(voyage.id))
      .map((voyage) => voyage.id)
    const checked = productVoyageIds.length > 0 && productVoyageIds.every((id) => pendingAddIds.includes(id))
    setPendingAddIds((prev) => checked ? prev.filter((id) => !productVoyageIds.includes(id)) : Array.from(new Set([...prev, ...productVoyageIds])))
  }

  const togglePendingRemoveProduct = (productId: string) => {
    const productVoyageIds = selectedVoyages.filter((voyage) => voyage.productId === productId).map((voyage) => voyage.id)
    const checked = productVoyageIds.length > 0 && productVoyageIds.every((id) => pendingRemoveIds.includes(id))
    setPendingRemoveIds((prev) => checked ? prev.filter((id) => !productVoyageIds.includes(id)) : Array.from(new Set([...prev, ...productVoyageIds])))
  }

  const toggleId = (ids: string[], setIds: (ids: string[]) => void, id: string) => {
    setIds(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])
  }

  const addSelected = () => {
    updateScope([...safeValue.voyageIds, ...pendingAddIds])
    setPendingAddIds([])
  }

  const removeSelected = () => {
    updateScope(safeValue.voyageIds.filter((id) => !pendingRemoveIds.includes(id)))
    setPendingRemoveIds([])
  }

  const clearScope = () => {
    updateScope([])
    setPendingAddIds([])
    setPendingRemoveIds([])
  }

  const renderProductVoyageTree = (
    mode: 'available' | 'selected',
    checkedIds: string[],
    toggleProduct: (productId: string) => void,
    toggleVoyage: (voyageId: string) => void,
  ) => {
    const sourceVoyages = mode === 'available'
      ? voyages.filter((voyage) => !safeValue.voyageIds.includes(voyage.id))
      : selectedVoyages
    const emptyText = mode === 'available' ? '暂无可选航次' : '尚未选择航次'

    if (sourceVoyages.length === 0) {
      return <div className="px-3 py-8 text-center text-sm text-gray-400">{emptyText}</div>
    }

    return products.map((product) => {
      const productVoyages = sourceVoyages.filter((voyage) => voyage.productId === product.id)
      if (productVoyages.length === 0) return null
      const productVoyageIds = productVoyages.map((voyage) => voyage.id)
      const checked = productVoyageIds.every((id) => checkedIds.includes(id))
      const partial = !checked && productVoyageIds.some((id) => checkedIds.includes(id))

      return (
        <div key={product.id} className="border-b border-gray-100 last:border-b-0">
          <label className="flex cursor-pointer items-start gap-2 bg-gray-50 px-3 py-2 text-sm hover:bg-blue-50">
            <input
              type="checkbox"
              checked={checked}
              ref={(node) => { if (node) node.indeterminate = partial }}
              onChange={() => toggleProduct(product.id)}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <span>
              <span className="block font-medium text-gray-900">{product.name}</span>
              <span className="text-xs text-gray-500">{product.routeName}</span>
            </span>
          </label>
          <div className="divide-y divide-gray-100">
            {productVoyages.map((voyage) => (
              <label key={voyage.id} className="flex cursor-pointer items-start gap-2 px-8 py-2 text-sm hover:bg-blue-50">
                <input
                  type="checkbox"
                  checked={checkedIds.includes(voyage.id)}
                  onChange={() => toggleVoyage(voyage.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <span>
                  <span className="block font-medium text-gray-900">{voyage.voyageNo}</span>
                  <span className="text-xs text-gray-500">{voyage.shipName} · {formatDate(voyage.startDate)} 至 {formatDate(voyage.endDate)}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )
    })
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">适用范围</div>
          <div className="mt-0.5 text-xs text-gray-500">一级为产品，二级为航次；从左侧选择后加入到右侧</div>
        </div>
        <button type="button" onClick={clearScope} className="text-xs text-gray-500 hover:text-gray-700">清空</button>
      </div>

      <div className="grid grid-cols-[1fr_72px_1fr] rounded-lg border border-gray-200">
        <div className="border-r border-gray-200">
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
            <span>可选产品/航次</span>
            <span>{availableVoyageIds.length}个航次</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {renderProductVoyageTree(
              'available',
              pendingAddIds,
              togglePendingAddProduct,
              (voyageId) => toggleId(pendingAddIds, setPendingAddIds, voyageId),
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 border-r border-gray-200 bg-gray-50/60 px-3">
          <button
            type="button"
            disabled={pendingAddIds.length === 0}
            onClick={addSelected}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            title="加入"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={pendingRemoveIds.length === 0}
            onClick={removeSelected}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
            title="移除"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
            <span>已选产品/航次</span>
            <span>{selectedVoyages.length}个航次</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {renderProductVoyageTree(
              'selected',
              pendingRemoveIds,
              togglePendingRemoveProduct,
              (voyageId) => toggleId(pendingRemoveIds, setPendingRemoveIds, voyageId),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
