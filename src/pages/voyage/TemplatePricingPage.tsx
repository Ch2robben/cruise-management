import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import { productApi } from '@/mock/api'
import { products, ships, voyageTemplates } from '@/mock/data'
import type { PricingRow, Product, VoyageTemplate } from '@/types'

interface PricingTableRow {
  row: PricingRow
  idx: number
  isFirst: boolean
  rowSpan: number
}

function buildGroupedRows(pricingRows: PricingRow[]): PricingTableRow[] {
  const rows: PricingTableRow[] = []
  let i = 0
  while (i < pricingRows.length) {
    const key = pricingRows[i].segmentKey
    let j = i
    while (j < pricingRows.length && pricingRows[j].segmentKey === key) j++
    const span = j - i
    for (let k = i; k < j; k++) {
      rows.push({ row: pricingRows[k], idx: k, isFirst: k === i, rowSpan: span })
    }
    i = j
  }
  return rows
}

export default function TemplatePricingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [templateId, setTemplateId] = useState(searchParams.get('templateId') || '')
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([])
  const [saving, setSaving] = useState(false)

  const template = useMemo<VoyageTemplate | null>(
    () => voyageTemplates.find((item) => item.id === templateId) || null,
    [templateId],
  )
  const product = useMemo<Product | null>(
    () => products.find((item) => item.id === template?.productId) || null,
    [template],
  )
  const ship = useMemo(
    () => ships.find((item) => item.id === product?.shipId),
    [product],
  )

  useEffect(() => {
    if (!product) {
      setPricingRows([])
      return
    }
    setPricingRows(product.pricing.map((item) => ({ ...item })))
  }, [product])

  const groupedRows = useMemo(() => buildGroupedRows(pricingRows), [pricingRows])

  const updatePricingRow = (index: number, field: 'costPrice' | 'basePrice', value: number) => {
    setPricingRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleTemplateChange = (nextTemplateId: string) => {
    setTemplateId(nextTemplateId)
    setSearchParams(nextTemplateId ? { templateId: nextTemplateId } : {})
  }

  const savePricing = async () => {
    if (!product) return
    setSaving(true)
    await productApi.updatePricing(product.id, pricingRows)
    setSaving(false)
  }

  return (
    <div>
      <PageHeader title="模板定价" description="按航次模板关联产品维护价格矩阵" />

      <div className="border border-gray-200 bg-white">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-gray-200 px-9 py-8">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">航次模板</label>
            <select
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">请选择航次模板</option>
              {voyageTemplates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          {template && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-500">关联产品</span>
                <span className="text-sm text-gray-800">{template.productName || '-'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-500">适用游轮</span>
                <span className="text-sm text-gray-800">{template.shipName || '-'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-500">价格规模</span>
                <span className="text-sm text-gray-800">
                  {product?.segments.length || 0} 航段 x {ship?.cabinTypes.length || 0} 舱型
                </span>
              </div>
            </>
          )}
        </div>

        {!template || !product ? (
          <div className="px-9 py-20 text-center text-sm text-gray-400">请选择一个航次模板</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-r border-gray-200 px-4 py-4 text-left text-[15px] font-semibold text-gray-800">起止港</th>
                    <th className="border-b border-r border-gray-200 px-4 py-4 text-left text-[15px] font-semibold text-gray-800">舱房类型</th>
                    <th className="border-b border-r border-gray-200 px-4 py-4 text-right text-[15px] font-semibold text-gray-800">成本价(¥)</th>
                    <th className="border-b border-r border-gray-200 px-4 py-4 text-right text-[15px] font-semibold text-gray-800">基准价(¥)</th>
                    <th className="border-b border-gray-200 px-4 py-4 text-right text-[15px] font-semibold text-gray-800">毛利率</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.map(({ row, idx, isFirst, rowSpan }) => {
                    const margin = row.basePrice > 0 ? ((row.basePrice - row.costPrice) / row.basePrice * 100).toFixed(1) : '0.0'
                    return (
                      <tr key={`${row.segmentKey}-${row.cabinType}-${idx}`} className="transition hover:bg-gray-50">
                        {isFirst && (
                          <td className="border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700" rowSpan={rowSpan}>
                            {row.startPort} - {row.endPort}
                          </td>
                        )}
                        <td className="border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700">{row.cabinType}</td>
                        <td className="border-b border-r border-gray-200 px-4 py-5">
                          <div className="flex justify-end">
                            <input
                              type="number"
                              value={row.costPrice}
                              onChange={(e) => updatePricingRow(idx, 'costPrice', Number(e.target.value))}
                              className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-gray-900 focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="border-b border-r border-gray-200 px-4 py-5">
                          <div className="flex justify-end">
                            <input
                              type="number"
                              value={row.basePrice}
                              onChange={(e) => updatePricingRow(idx, 'basePrice', Number(e.target.value))}
                              className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-gray-900 focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="border-b border-gray-200 px-4 py-5 text-right">
                          <span className={`text-sm font-medium ${Number(margin) >= 30 ? 'text-green-600' : Number(margin) >= 15 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-9 py-6">
              <button
                onClick={() => product && setPricingRows(product.pricing.map((item) => ({ ...item })))}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                重置
              </button>
              <button
                onClick={savePricing}
                disabled={saving}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存定价'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
