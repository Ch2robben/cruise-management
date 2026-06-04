import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { products } from '@/mock/data'

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
  return {
    productIds: [firstProduct.id],
    voyageIds: [],
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
  if (safeScope.productIds.length === 0) return '未配置'
  return `${safeScope.productIds.length}个产品`
}

export function formatApplicableScopeDetail(scope?: ApplicableScope) {
  const safeScope = normalizeApplicableScope(scope)
  if (safeScope.productIds.length === 0) return '未配置'

  return safeScope.productIds.map((productId) => {
    const product = products.find((item) => item.id === productId)
    return product ? product.name : ''
  }).filter(Boolean).join('、')
}

export function scopeIncludesProduct(scope: ApplicableScope | undefined, productId: string) {
  return normalizeApplicableScope(scope).productIds.includes(productId)
}

export default function ApplicableScopeTransfer({ value, onChange }: ApplicableScopeTransferProps) {
  const safeValue = normalizeApplicableScope(value)
  const [pendingAddIds, setPendingAddIds] = useState<string[]>([])
  const [pendingRemoveIds, setPendingRemoveIds] = useState<string[]>([])

  const availableProducts = useMemo(() => (
    products.filter((product) => !safeValue.productIds.includes(product.id))
  ), [safeValue.productIds])

  const selectedProducts = useMemo(() => (
    products.filter((product) => safeValue.productIds.includes(product.id))
  ), [safeValue.productIds])

  const updateScope = (nextProductIds: string[]) => {
    onChange({
      productIds: Array.from(new Set(nextProductIds)),
      voyageIds: [],
    })
  }

  const toggleId = (ids: string[], setIds: (ids: string[]) => void, id: string) => {
    setIds(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])
  }

  const addSelected = () => {
    updateScope([...safeValue.productIds, ...pendingAddIds])
    setPendingAddIds([])
  }

  const removeSelected = () => {
    updateScope(safeValue.productIds.filter((id) => !pendingRemoveIds.includes(id)))
    setPendingRemoveIds([])
  }

  const clearScope = () => {
    updateScope([])
    setPendingAddIds([])
    setPendingRemoveIds([])
  }

  const renderProductList = (
    mode: 'available' | 'selected',
    checkedIds: string[],
    toggleProduct: (productId: string) => void,
  ) => {
    const sourceProducts = mode === 'available' ? availableProducts : selectedProducts
    const emptyText = mode === 'available' ? '暂无可选产品' : '尚未选择产品'

    if (sourceProducts.length === 0) {
      return <div className="px-3 py-8 text-center text-sm text-gray-400">{emptyText}</div>
    }

    return sourceProducts.map((product) => {
      const checked = checkedIds.includes(product.id)

      return (
        <label key={product.id} className="flex cursor-pointer items-start gap-2 border-b border-gray-100 bg-white px-3 py-2 text-sm last:border-b-0 hover:bg-blue-50">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggleProduct(product.id)}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <span>
            <span className="block font-medium text-gray-900">{product.name}</span>
            <span className="text-xs text-gray-500">{product.routeName}</span>
          </span>
        </label>
      )
    })
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">适用范围</div>
          <div className="mt-0.5 text-xs text-gray-500">从左侧选择产品后加入到右侧</div>
        </div>
        <button type="button" onClick={clearScope} className="text-xs text-gray-500 hover:text-gray-700">清空</button>
      </div>

      <div className="grid grid-cols-[1fr_72px_1fr] rounded-lg border border-gray-200">
        <div className="border-r border-gray-200">
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
            <span>可选产品</span>
            <span>{availableProducts.length}个产品</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {renderProductList(
              'available',
              pendingAddIds,
              (productId) => toggleId(pendingAddIds, setPendingAddIds, productId),
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
            <span>已选产品</span>
            <span>{selectedProducts.length}个产品</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {renderProductList(
              'selected',
              pendingRemoveIds,
              (productId) => toggleId(pendingRemoveIds, setPendingRemoveIds, productId),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
