import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import {
  filterVoyageIncomeStatistics,
  voyageIncomeAgencyOptions,
  voyageIncomeShipOptions,
  voyageSalesModes,
  type VoyageIncomeStatisticRow,
} from '@/mock/voyageIncomeStatistics'
import { formatCurrency } from '@/utils/format'

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function exportRows(rows: VoyageIncomeStatisticRow[]) {
  const headers = [
    '序号', '航次', '开航日期', '销售人员', '销售模式', '订单号', '游轮名称',
    '订单接待量', '实际接待量', '代理商（客户）', '挂牌均价', '结算均价',
    '船票收入', '附加产品收入', '观光门票', '小计',
  ]
  const data = rows.map((row, index) => [
    index + 1,
    row.voyageNo,
    row.sailDate,
    row.salesperson,
    row.salesMode,
    row.orderNo,
    row.shipName,
    row.orderReception,
    row.actualReception,
    row.agentName,
    row.listAvgPrice.toFixed(2),
    row.settleAvgPrice.toFixed(2),
    row.ticketIncome.toFixed(2),
    row.addonIncome.toFixed(2),
    row.sightseeingIncome.toFixed(2),
    row.subtotal.toFixed(2),
  ])
  const csv = [headers, ...data].map((line) => line.map(escapeCsv).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `航次收入统计报表_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const thBase = 'border-b border-r border-gray-200 px-3 py-3 text-xs font-medium text-gray-500 last:border-r-0'
const tdBase = 'border-b border-r border-gray-200 px-3 py-3 text-sm text-gray-700 last:border-r-0'

export default function VoyageIncomeStatisticsPage() {
  const [dateFrom, setDateFrom] = useState('2026-08-01')
  const [dateTo, setDateTo] = useState('2026-08-27')
  const [shipName, setShipName] = useState('all')
  const [salesMode, setSalesMode] = useState('all')
  const [agencyName, setAgencyName] = useState('all')
  const [voyageNo, setVoyageNo] = useState('')
  const [applied, setApplied] = useState({
    dateFrom: '2026-08-01',
    dateTo: '2026-08-27',
    shipName: 'all',
    salesMode: 'all',
    agencyName: 'all',
    voyageNo: '',
  })

  const rows = useMemo(
    () => filterVoyageIncomeStatistics(applied),
    [applied],
  )

  const handleSearch = () => {
    setApplied({
      dateFrom,
      dateTo,
      shipName,
      salesMode,
      agencyName,
      voyageNo,
    })
  }

  const totals = useMemo(() => ({
    orderReception: rows.reduce((sum, row) => sum + row.orderReception, 0),
    actualReception: rows.reduce((sum, row) => sum + row.actualReception, 0),
    ticketIncome: rows.reduce((sum, row) => sum + row.ticketIncome, 0),
    addonIncome: rows.reduce((sum, row) => sum + row.addonIncome, 0),
    sightseeingIncome: rows.reduce((sum, row) => sum + row.sightseeingIncome, 0),
    subtotal: rows.reduce((sum, row) => sum + row.subtotal, 0),
  }), [rows])

  return (
    <div>
      <PageHeader title="航次收入统计报表" />

      <div className="border-b border-gray-200 bg-white px-9 py-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">查询时段</span>
            <div className="flex h-10 items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-10 w-36 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-10 w-36 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">游轮</span>
            <select
              value={shipName}
              onChange={(event) => setShipName(event.target.value)}
              className="h-10 w-40 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="all">全部</option>
              {voyageIncomeShipOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">销售模式</span>
            <select
              value={salesMode}
              onChange={(event) => setSalesMode(event.target.value)}
              className="h-10 w-36 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="all">全部</option>
              {voyageSalesModes.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">组团社</span>
            <select
              value={agencyName}
              onChange={(event) => setAgencyName(event.target.value)}
              className="h-10 w-52 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="all">全部</option>
              {voyageIncomeAgencyOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">航次号</span>
            <input
              value={voyageNo}
              onChange={(event) => setVoyageNo(event.target.value)}
              placeholder="请输入"
              className="h-10 w-44 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Search className="h-4 w-4" />
            查询
          </button>
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={() => exportRows(rows)}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            导出
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full min-w-[1680px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th rowSpan={2} className={`${thBase} text-left`}>序号</th>
              <th rowSpan={2} className={`${thBase} text-left`}>航次</th>
              <th rowSpan={2} className={`${thBase} text-left`}>销售人员</th>
              <th rowSpan={2} className={`${thBase} text-left`}>销售模式</th>
              <th rowSpan={2} className={`${thBase} text-left`}>订单号</th>
              <th rowSpan={2} className={`${thBase} text-left`}>游轮名称</th>
              <th rowSpan={2} className={`${thBase} text-right`}>订单接待量</th>
              <th rowSpan={2} className={`${thBase} text-right`}>实际接待量</th>
              <th rowSpan={2} className={`${thBase} text-left`}>代理商（客户）</th>
              <th rowSpan={2} className={`${thBase} text-right`}>挂牌均价</th>
              <th rowSpan={2} className={`${thBase} text-right`}>结算均价</th>
              <th colSpan={4} className={`${thBase} text-center`}>收入金额</th>
            </tr>
            <tr className="bg-gray-50">
              <th className={`${thBase} text-right`}>船票收入</th>
              <th className={`${thBase} text-right`}>附加产品</th>
              <th className={`${thBase} text-right`}>观光门票</th>
              <th className={`${thBase} text-right`}>小计</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-20 text-center text-sm text-gray-400">暂无数据</td>
              </tr>
            ) : (
              <>
                {rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className={`${tdBase} text-center tabular-nums`}>{index + 1}</td>
                    <td className={tdBase}>
                      <div className="font-mono font-medium text-blue-700">{row.voyageNo}</div>
                      <div className="mt-0.5 text-xs text-gray-400">{row.sailDate}</div>
                    </td>
                    <td className={tdBase}>{row.salesperson}</td>
                    <td className={tdBase}>{row.salesMode}</td>
                    <td className={`${tdBase} font-mono text-xs`}>{row.orderNo}</td>
                    <td className={tdBase}>{row.shipName}</td>
                    <td className={`${tdBase} text-right tabular-nums`}>{row.orderReception}</td>
                    <td className={`${tdBase} text-right tabular-nums`}>{row.actualReception}</td>
                    <td className={tdBase}>{row.agentName}</td>
                    <td className={`${tdBase} text-right tabular-nums`}>{formatCurrency(row.listAvgPrice)}</td>
                    <td className={`${tdBase} text-right tabular-nums`}>{formatCurrency(row.settleAvgPrice)}</td>
                    <td className={`${tdBase} text-right tabular-nums`}>{formatCurrency(row.ticketIncome)}</td>
                    <td className={`${tdBase} text-right tabular-nums`}>{formatCurrency(row.addonIncome)}</td>
                    <td className={`${tdBase} text-right tabular-nums`}>{formatCurrency(row.sightseeingIncome)}</td>
                    <td className={`${tdBase} text-right font-medium tabular-nums text-gray-900`}>
                      {formatCurrency(row.subtotal)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-medium">
                  <td className={`${tdBase} text-center`} colSpan={6}>合计</td>
                  <td className={`${tdBase} text-right tabular-nums`}>{totals.orderReception}</td>
                  <td className={`${tdBase} text-right tabular-nums`}>{totals.actualReception}</td>
                  <td className={tdBase} colSpan={3} />
                  <td className={`${tdBase} text-right tabular-nums`}>{formatCurrency(totals.ticketIncome)}</td>
                  <td className={`${tdBase} text-right tabular-nums`}>{formatCurrency(totals.addonIncome)}</td>
                  <td className={`${tdBase} text-right tabular-nums`}>{formatCurrency(totals.sightseeingIncome)}</td>
                  <td className={`${tdBase} text-right font-semibold tabular-nums text-blue-700`}>
                    {formatCurrency(totals.subtotal)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
