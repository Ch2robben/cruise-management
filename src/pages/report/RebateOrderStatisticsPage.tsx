import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Download, RotateCcw, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { getOrders } from '@/mock/orderStore'
import {
  buildRebateOrderStatistics,
  rebateStatisticPolicies,
  type MatchedRebatePolicy,
  type RebateOrderGroupStatistic,
  type RebateOrderSettlementStatus,
} from '@/mock/rebateOrderStatistics'
import { formatCurrency } from '@/utils/format'

const settlementStatusLabels: Record<RebateOrderSettlementStatus, string> = {
  pending_review: '待复核',
  calculated: '已计算',
  settled: '已结算',
}

const settlementStatusClasses: Record<RebateOrderSettlementStatus, string> = {
  pending_review: 'bg-amber-50 text-amber-700',
  calculated: 'bg-blue-50 text-blue-700',
  settled: 'bg-green-50 text-green-700',
}

function policyTypeLabel(policy: MatchedRebatePolicy) {
  return policy.policyType === 'rebate_point' ? '返利点' : '销售额返利'
}

function cycleLabel(policy: MatchedRebatePolicy) {
  return policy.settlementCycle === 'voyage' ? '按航次' : '按月'
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function exportStatistics(rows: RebateOrderGroupStatistic[]) {
  const headers = [
    '旅行团', '返利分销商', '航次号', '开航日期', '游轮', '线路', '订单号', '订单数', '人数',
    '返利订单金额', '政策编码', '命中政策', '政策类型', '结算周期', '任务完成率', '命中阶梯',
    '阶梯返利率', '政策返利金额', '团综合返利率', '团返利金额', '结算状态', '计算时间',
  ]
  const data = rows.flatMap((row) => row.matchedPolicies.map((policy) => [
    row.groupName,
    row.distributor,
    row.voyageNo,
    row.sailDate,
    row.ship,
    row.route,
    row.orderNos.join('、'),
    row.orderNos.length,
    row.passengers,
    row.eligibleOrderAmount.toFixed(2),
    policy.policyCode,
    policy.policyName,
    policyTypeLabel(policy),
    cycleLabel(policy),
    `${policy.completionRate}%`,
    policy.tierLabel,
    `${policy.direction === 'deduction' ? '-' : ''}${policy.rebateRate}%`,
    policy.rebateAmount.toFixed(2),
    `${row.effectiveRebateRate}%`,
    row.rebateAmount.toFixed(2),
    settlementStatusLabels[row.settlementStatus],
    row.calculatedAt,
  ]))
  const csv = [headers, ...data].map((line) => line.map(escapeCsv).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `返利订单统计_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function RebateOrderStatisticsPage() {
  const [keyword, setKeyword] = useState('')
  const [distributor, setDistributor] = useState('all')
  const [policyCode, setPolicyCode] = useState('all')
  const [settlementStatus, setSettlementStatus] = useState<'all' | RebateOrderSettlementStatus>('all')
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const statistics = useMemo(() => buildRebateOrderStatistics(getOrders()), [])
  const distributorOptions = useMemo(() => [...new Set(statistics.map((item) => item.distributor))], [statistics])

  const filteredStatistics = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    return statistics.filter((item) => {
      const keywordMatched = !normalized || [
        item.groupName,
        item.voyageNo,
        item.ship,
        item.route,
        ...item.orderNos,
      ].some((value) => value.toLowerCase().includes(normalized))
      const distributorMatched = distributor === 'all' || item.distributor === distributor
      const policyMatched = policyCode === 'all' || item.matchedPolicies.some((policy) => policy.policyCode === policyCode)
      const statusMatched = settlementStatus === 'all' || item.settlementStatus === settlementStatus
      return keywordMatched && distributorMatched && policyMatched && statusMatched
    })
  }, [distributor, keyword, policyCode, settlementStatus, statistics])

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const resetFilters = () => {
    setKeyword('')
    setDistributor('all')
    setPolicyCode('all')
    setSettlementStatus('all')
  }

  const totalEligibleAmount = filteredStatistics.reduce((sum, item) => sum + item.eligibleOrderAmount, 0)
  const totalRebateAmount = filteredStatistics.reduce((sum, item) => sum + item.rebateAmount, 0)
  const orderCount = new Set(filteredStatistics.flatMap((item) => item.orderNos)).size
  const pendingCount = filteredStatistics.filter((item) => item.settlementStatus === 'pending_review').length
  const averageRate = totalEligibleAmount > 0 ? totalRebateAmount / totalEligibleAmount * 100 : 0

  return (
    <div>
      <PageHeader title="返利订单统计" description="统计符合返利规则的订单，按旅行团聚合返利基数，返利归属分销商，并展示命中政策、阶梯和航次信息。">
        <button data-testid="rebate-order-export" type="button" disabled={filteredStatistics.length === 0} onClick={() => exportStatistics(filteredStatistics)} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" />导出统计结果</button>
      </PageHeader>

      <div className="border-b border-gray-200 bg-white px-9 py-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5"><span className="text-xs text-gray-500">旅行团 / 订单 / 航次</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入关键词" className="h-10 w-72 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs text-gray-500">返利分销商</span><select data-testid="rebate-distributor-filter" value={distributor} onChange={(event) => setDistributor(event.target.value)} className="h-10 w-44 rounded-md border border-gray-300 bg-white px-3 text-sm"><option value="all">全部分销商</option>{distributorOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs text-gray-500">命中政策</span><select data-testid="rebate-policy-filter" value={policyCode} onChange={(event) => setPolicyCode(event.target.value)} className="h-10 w-56 rounded-md border border-gray-300 bg-white px-3 text-sm"><option value="all">全部政策</option>{rebateStatisticPolicies.map((policy) => <option key={policy.code} value={policy.code}>{policy.code} · {policy.name}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs text-gray-500">结算状态</span><select value={settlementStatus} onChange={(event) => setSettlementStatus(event.target.value as 'all' | RebateOrderSettlementStatus)} className="h-10 w-36 rounded-md border border-gray-300 bg-white px-3 text-sm"><option value="all">全部状态</option><option value="pending_review">待复核</option><option value="calculated">已计算</option><option value="settled">已结算</option></select></label>
          <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"><Search className="h-4 w-4" />查询</button>
          <button type="button" onClick={resetFilters} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-600 hover:bg-gray-50"><RotateCcw className="h-4 w-4" />重置</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-gray-200 bg-gray-50 px-9 py-5 lg:grid-cols-6">
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3"><div className="text-xs text-gray-500">符合返利旅行团</div><div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{filteredStatistics.length}</div></div>
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3"><div className="text-xs text-gray-500">符合返利订单</div><div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{orderCount}</div></div>
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3"><div className="text-xs text-gray-500">返利订单金额</div><div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{formatCurrency(totalEligibleAmount)}</div></div>
        <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3"><div className="text-xs text-blue-700">预计返利金额</div><div className="mt-1 text-xl font-semibold tabular-nums text-blue-800">{formatCurrency(totalRebateAmount)}</div></div>
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3"><div className="text-xs text-gray-500">综合返利率</div><div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{averageRate.toFixed(2)}%</div></div>
        <div className="rounded-md border border-amber-100 bg-amber-50 px-4 py-3"><div className="text-xs text-amber-700">待复核旅行团</div><div className="mt-1 text-xl font-semibold tabular-nums text-amber-800">{pendingCount}</div></div>
      </div>

      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full min-w-[1600px] border-collapse text-sm">
          <thead><tr className="bg-gray-50">{['', '旅行团', '返利分销商', '航次信息', '订单', '人数', '返利订单金额', '命中政策', '命中阶梯', '综合返利率', '返利金额', '结算状态', '计算时间'].map((title) => <th key={title || 'expand'} className={`border-b border-r border-gray-200 px-4 py-4 text-xs font-medium text-gray-500 last:border-r-0 ${['人数', '返利订单金额', '综合返利率', '返利金额'].includes(title) ? 'text-right' : 'text-left'}`}>{title}</th>)}</tr></thead>
          <tbody>
            {filteredStatistics.length === 0 ? <tr><td colSpan={13} className="py-20 text-center text-sm text-gray-400">暂无符合当前条件的返利订单</td></tr> : filteredStatistics.map((item) => {
              const expanded = expandedIds.includes(item.id)
              return (
                <Fragment key={item.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="w-12 border-b border-r border-gray-200 px-4 py-4"><button data-testid={`rebate-expand-${item.id}`} type="button" onClick={() => toggleExpanded(item.id)} className="rounded p-1 text-gray-500 hover:bg-gray-100">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button></td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 font-medium text-gray-900">{item.groupName}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-700">{item.distributor}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4"><div className="font-mono font-medium text-blue-700">{item.voyageNo}</div><div className="mt-1 text-xs text-gray-500">{item.sailDate} · {item.ship} · {item.route}</div></td>
                    <td className="border-b border-r border-gray-200 px-4 py-4"><div className="font-medium text-gray-800">{item.orderNos.length} 张</div><div className="mt-1 max-w-[180px] truncate font-mono text-xs text-gray-400" title={item.orderNos.join('、')}>{item.orderNos.join('、')}</div></td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-right tabular-nums">{item.passengers}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-right font-medium tabular-nums text-gray-900">{formatCurrency(item.eligibleOrderAmount)}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4"><div className="space-y-1">{item.matchedPolicies.map((policy) => <div key={policy.policyCode}><span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{policy.policyCode}</span><span className="ml-1 text-xs text-gray-700">{policy.policyName}</span></div>)}</div></td>
                    <td className="border-b border-r border-gray-200 px-4 py-4"><div className="space-y-1.5">{item.matchedPolicies.map((policy) => <div key={policy.policyCode} className="text-xs"><div className="font-medium text-gray-700">{policy.tierLabel}</div><div className="mt-0.5 text-gray-400">完成率 {policy.completionRate}% · {policy.direction === 'deduction' ? '扣' : '返'} {policy.rebateRate}%</div></div>)}</div></td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-right font-medium tabular-nums text-blue-700">{item.effectiveRebateRate.toFixed(2)}%</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-right font-semibold tabular-nums text-blue-700">{formatCurrency(item.rebateAmount)}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4"><span className={`rounded px-2 py-0.5 text-xs font-medium ${settlementStatusClasses[item.settlementStatus]}`}>{settlementStatusLabels[item.settlementStatus]}</span></td>
                    <td className="border-b border-gray-200 px-4 py-4 text-xs text-gray-500">{item.calculatedAt}</td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={13} className="border-b border-gray-200 bg-gray-50 p-4">
                        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
                          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3"><div className="text-sm font-medium text-gray-800">{item.groupName} · 返利计算明细</div><div className="text-xs text-gray-500">来源订单：{item.orderNos.join('、')}</div></div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[1120px] text-xs">
                              <thead><tr className="bg-gray-50">{['优先级', '政策编码 / 名称', '类型 / 周期', '任务完成率', '命中阶梯', '返利基数', '阶梯比例', '政策返利金额', '计算说明'].map((title) => <th key={title} className={`border-b border-r border-gray-200 px-3 py-3 font-medium text-gray-500 last:border-r-0 ${['返利基数', '阶梯比例', '政策返利金额'].includes(title) ? 'text-right' : 'text-left'}`}>{title}</th>)}</tr></thead>
                              <tbody>{item.matchedPolicies.map((policy) => <tr key={policy.policyCode} className="hover:bg-gray-50"><td className="border-b border-r border-gray-200 px-3 py-3 text-center">{policy.priority}</td><td className="border-b border-r border-gray-200 px-3 py-3"><div className="font-mono text-blue-700">{policy.policyCode}</div><div className="mt-0.5 font-medium text-gray-800">{policy.policyName}</div></td><td className="border-b border-r border-gray-200 px-3 py-3"><div>{policyTypeLabel(policy)}</div><div className="mt-0.5 text-gray-400">{cycleLabel(policy)}</div></td><td className="border-b border-r border-gray-200 px-3 py-3 tabular-nums">{policy.completionRate}%</td><td className="border-b border-r border-gray-200 px-3 py-3">{policy.tierLabel}</td><td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{formatCurrency(policy.rebateBaseAmount)}</td><td className={`border-b border-r border-gray-200 px-3 py-3 text-right font-medium tabular-nums ${policy.direction === 'deduction' ? 'text-red-600' : 'text-green-700'}`}>{policy.direction === 'deduction' ? '-' : '+'}{policy.rebateRate}%</td><td className={`border-b border-r border-gray-200 px-3 py-3 text-right font-medium tabular-nums ${policy.rebateAmount < 0 ? 'text-red-600' : 'text-blue-700'}`}>{formatCurrency(policy.rebateAmount)}</td><td className="border-b border-gray-200 px-3 py-3 text-gray-600">{policy.calculationNote}</td></tr>)}</tbody>
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
