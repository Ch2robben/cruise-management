import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Download, RotateCcw, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { getOrders } from '@/mock/orderStore'
import {
  orderAdditionalProductLines,
  type AdditionalProductSyncStatus,
  type OrderAdditionalProductLine,
} from '@/mock/orderAdditionalProducts'
import { formatCurrency } from '@/utils/format'

const syncStatusLabels: Record<AdditionalProductSyncStatus, string> = {
  pending: '待同步',
  synced: '已同步',
  failed: '同步失败',
}

const syncStatusClasses: Record<AdditionalProductSyncStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  synced: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-600',
}

interface VoyageAdditionalGroup {
  voyageNo: string
  sailDate: string
  ship: string
  route: string
  rows: OrderAdditionalProductLine[]
  orderCount: number
  personQuantity: number
  roomQuantity: number
  totalAmount: number
  pendingCount: number
  failedCount: number
  syncedCount: number
  sourceNames: string[]
  lastSyncAt: string
  status: AdditionalProductSyncStatus
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function exportCsv(rows: OrderAdditionalProductLine[], voyageNo?: string) {
  const headers = [
    '航次号', '开航日期', '订单号', '组团社', '分类', '附加产品', '收取方式', '收取对象类型',
    '收取对象', '数量', '单价', '金额', '外部来源', '外部编码', '同步状态', '最后同步时间',
    '同步说明', '资料更新时间',
  ]
  const data = rows.map((row) => [
    row.voyageNo,
    row.sailDate,
    row.orderNo,
    row.dealer,
    row.categoryPath,
    row.productName,
    row.chargeMethod === 'per_person' ? '按人' : '按房',
    row.targetType === 'person' ? '游客' : '房间',
    row.targetName,
    row.quantity,
    row.unitAmount.toFixed(2),
    row.totalAmount.toFixed(2),
    row.sourceName,
    row.externalCode,
    syncStatusLabels[row.syncStatus],
    row.lastSyncAt,
    row.syncMessage,
    row.updatedAt,
  ])
  const csv = [headers, ...data].map((line) => line.map(escapeCsv).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `航次附加产品外部同步清单_${voyageNo || '全部'}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function VoyageAdditionalProductPage() {
  const [keyword, setKeyword] = useState('')
  const [sourceName, setSourceName] = useState('all')
  const [syncStatus, setSyncStatus] = useState<'all' | AdditionalProductSyncStatus>('all')
  const [expandedVoyages, setExpandedVoyages] = useState<string[]>(['212103'])

  const orders = useMemo(() => getOrders(), [])
  const sourceOptions = useMemo(
    () => [...new Set(orderAdditionalProductLines.map((item) => item.sourceName))],
    [],
  )

  const filteredLines = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    return orderAdditionalProductLines.filter((row) => {
      const order = orders.find((item) => item.orderNo === row.orderNo)
      const keywordMatched = !normalized || [
        row.voyageNo,
        row.orderNo,
        row.productName,
        row.targetName,
        row.externalCode,
        order?.ship ?? '',
        order?.route ?? '',
      ].some((value) => value.toLowerCase().includes(normalized))
      const sourceMatched = sourceName === 'all' || row.sourceName === sourceName
      const statusMatched = syncStatus === 'all' || row.syncStatus === syncStatus
      return keywordMatched && sourceMatched && statusMatched
    })
  }, [keyword, orders, sourceName, syncStatus])

  const voyageGroups = useMemo<VoyageAdditionalGroup[]>(() => {
    const grouped = new Map<string, OrderAdditionalProductLine[]>()
    filteredLines.forEach((row) => grouped.set(row.voyageNo, [...(grouped.get(row.voyageNo) ?? []), row]))
    return [...grouped.entries()].map(([voyageNo, rows]) => {
      const order = orders.find((item) => item.voyageNo === voyageNo)
      const pendingCount = rows.filter((row) => row.syncStatus === 'pending').length
      const failedCount = rows.filter((row) => row.syncStatus === 'failed').length
      const syncedCount = rows.filter((row) => row.syncStatus === 'synced').length
      const status: AdditionalProductSyncStatus = failedCount > 0 ? 'failed' : pendingCount > 0 ? 'pending' : 'synced'
      return {
        voyageNo,
        sailDate: rows[0]?.sailDate ?? order?.sailDate ?? '-',
        ship: order?.ship ?? '-',
        route: order?.route ?? '-',
        rows,
        orderCount: new Set(rows.map((row) => row.orderNo)).size,
        personQuantity: rows.filter((row) => row.targetType === 'person').reduce((sum, row) => sum + row.quantity, 0),
        roomQuantity: rows.filter((row) => row.targetType === 'room').reduce((sum, row) => sum + row.quantity, 0),
        totalAmount: rows.reduce((sum, row) => sum + row.totalAmount, 0),
        pendingCount,
        failedCount,
        syncedCount,
        sourceNames: [...new Set(rows.map((row) => row.sourceName))],
        lastSyncAt: rows.map((row) => row.lastSyncAt).filter(Boolean).sort().reverse()[0] ?? '',
        status,
      }
    }).sort((a, b) => b.sailDate.localeCompare(a.sailDate))
  }, [filteredLines, orders])

  const toggleVoyage = (voyageNo: string) => {
    setExpandedVoyages((current) => current.includes(voyageNo)
      ? current.filter((item) => item !== voyageNo)
      : [...current, voyageNo])
  }

  const resetFilters = () => {
    setKeyword('')
    setSourceName('all')
    setSyncStatus('all')
  }

  const totalAmount = filteredLines.reduce((sum, row) => sum + row.totalAmount, 0)
  const pendingCount = filteredLines.filter((row) => row.syncStatus === 'pending').length
  const failedCount = filteredLines.filter((row) => row.syncStatus === 'failed').length

  return (
    <div>
      <PageHeader title="航次附加产品清单" description="按航次汇总订单附加产品，展开查看游客/房间明细，并导出给外部酒店、票务系统同步。">
        <button data-testid="voyage-additional-export" type="button" disabled={filteredLines.length === 0} onClick={() => exportCsv(filteredLines)} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" />导出当前清单</button>
      </PageHeader>

      <div className="border-b border-gray-200 bg-white px-9 py-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5"><span className="text-xs text-gray-500">航次 / 订单 / 产品 / 对象</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入关键词" className="h-10 w-72 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs text-gray-500">外部来源</span><select value={sourceName} onChange={(event) => setSourceName(event.target.value)} className="h-10 w-48 rounded-md border border-gray-300 bg-white px-3 text-sm"><option value="all">全部来源</option>{sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs text-gray-500">同步状态</span><select data-testid="voyage-additional-status" value={syncStatus} onChange={(event) => setSyncStatus(event.target.value as 'all' | AdditionalProductSyncStatus)} className="h-10 w-36 rounded-md border border-gray-300 bg-white px-3 text-sm"><option value="all">全部状态</option><option value="pending">待同步</option><option value="synced">已同步</option><option value="failed">同步失败</option></select></label>
          <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"><Search className="h-4 w-4" />查询</button>
          <button type="button" onClick={resetFilters} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-600 hover:bg-gray-50"><RotateCcw className="h-4 w-4" />重置</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-gray-200 bg-gray-50 px-9 py-5 lg:grid-cols-5">
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3"><div className="text-xs text-gray-500">航次数</div><div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{voyageGroups.length}</div></div>
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3"><div className="text-xs text-gray-500">附加产品明细</div><div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{filteredLines.length}</div></div>
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3"><div className="text-xs text-gray-500">附加金额</div><div className="mt-1 text-xl font-semibold tabular-nums text-blue-700">{formatCurrency(totalAmount)}</div></div>
        <div className="rounded-md border border-amber-100 bg-amber-50 px-4 py-3"><div className="text-xs text-amber-700">待同步</div><div className="mt-1 text-xl font-semibold tabular-nums text-amber-800">{pendingCount}</div></div>
        <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3"><div className="text-xs text-red-600">同步失败</div><div className="mt-1 text-xl font-semibold tabular-nums text-red-700">{failedCount}</div></div>
      </div>

      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full min-w-[1320px] border-collapse text-sm">
          <thead><tr className="bg-gray-50">{['', '航次号', '开航日期', '游轮 / 线路', '订单数', '按人 / 按房', '明细数', '附加金额', '外部来源', '同步进度', '最后同步', '操作'].map((title) => <th key={title || 'expand'} className={`border-b border-r border-gray-200 px-4 py-4 text-xs font-medium text-gray-500 last:border-r-0 ${['订单数', '按人 / 按房', '明细数', '附加金额'].includes(title) ? 'text-right' : 'text-left'}`}>{title}</th>)}</tr></thead>
          <tbody>
            {voyageGroups.length === 0 ? <tr><td colSpan={12} className="py-20 text-center text-sm text-gray-400">暂无符合条件的航次附加产品</td></tr> : voyageGroups.map((group) => {
              const expanded = expandedVoyages.includes(group.voyageNo)
              return (
                <Fragment key={group.voyageNo}>
                  <tr className="hover:bg-gray-50">
                    <td className="w-12 border-b border-r border-gray-200 px-4 py-4"><button data-testid={`voyage-expand-${group.voyageNo}`} type="button" onClick={() => toggleVoyage(group.voyageNo)} className="rounded p-1 text-gray-500 hover:bg-gray-100">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button></td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 font-mono font-medium text-blue-700">{group.voyageNo}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-800">{group.sailDate}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4"><div className="font-medium text-gray-900">{group.ship}</div><div className="mt-1 text-xs text-gray-400">{group.route}</div></td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-right tabular-nums">{group.orderCount}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-right tabular-nums">{group.personQuantity} 人 / {group.roomQuantity} 房</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-right tabular-nums">{group.rows.length}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-right font-medium tabular-nums text-gray-900">{formatCurrency(group.totalAmount)}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4"><div className="flex max-w-[220px] flex-wrap gap-1">{group.sourceNames.map((source) => <span key={source} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{source}</span>)}</div></td>
                    <td className="border-b border-r border-gray-200 px-4 py-4"><span className={`rounded px-2 py-0.5 text-xs font-medium ${syncStatusClasses[group.status]}`}>{syncStatusLabels[group.status]}</span><div className="mt-1 text-xs text-gray-400">已同步 {group.syncedCount} / 待同步 {group.pendingCount} / 失败 {group.failedCount}</div></td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-xs text-gray-600">{group.lastSyncAt || '-'}</td>
                    <td className="border-b border-gray-200 px-4 py-4"><button type="button" onClick={() => exportCsv(group.rows, group.voyageNo)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><Download className="h-3.5 w-3.5" />导出航次</button></td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={12} className="border-b border-gray-200 bg-gray-50 p-4">
                        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
                          <div className="border-b border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800">航次 {group.voyageNo} · 订单附加产品明细</div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[1220px] text-xs">
                              <thead><tr className="bg-gray-50">{['订单号', '组团社', '附加产品', '收取对象', '数量', '单价', '金额', '外部来源 / 编码', '同步状态', '最后同步 / 说明'].map((title) => <th key={title} className={`border-b border-r border-gray-200 px-3 py-3 font-medium text-gray-500 last:border-r-0 ${['数量', '单价', '金额'].includes(title) ? 'text-right' : 'text-left'}`}>{title}</th>)}</tr></thead>
                              <tbody>{group.rows.map((row) => <tr key={row.id} className="hover:bg-gray-50"><td className="border-b border-r border-gray-200 px-3 py-3 font-mono text-blue-700">{row.orderNo}</td><td className="border-b border-r border-gray-200 px-3 py-3">{row.dealer}</td><td className="border-b border-r border-gray-200 px-3 py-3"><div className="font-medium text-gray-800">{row.productName}</div><div className="mt-0.5 text-gray-400">{row.categoryPath} · {row.chargeMethod === 'per_person' ? '按人' : '按房'}</div></td><td className="border-b border-r border-gray-200 px-3 py-3"><div>{row.targetName}</div><div className="mt-0.5 text-gray-400">{row.targetType === 'person' ? '游客' : '房间'}</div></td><td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{row.quantity}</td><td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{formatCurrency(row.unitAmount)}</td><td className="border-b border-r border-gray-200 px-3 py-3 text-right font-medium tabular-nums">{formatCurrency(row.totalAmount)}</td><td className="border-b border-r border-gray-200 px-3 py-3"><div>{row.sourceName}</div><div className="mt-0.5 font-mono text-gray-400">{row.externalCode}</div></td><td className="border-b border-r border-gray-200 px-3 py-3"><span className={`rounded px-2 py-0.5 ${syncStatusClasses[row.syncStatus]}`}>{syncStatusLabels[row.syncStatus]}</span></td><td className="border-b border-gray-200 px-3 py-3"><div>{row.lastSyncAt || '-'}</div>{row.syncMessage && <div className="mt-1 max-w-[260px] whitespace-normal text-red-500">{row.syncMessage}</div>}</td></tr>)}</tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
