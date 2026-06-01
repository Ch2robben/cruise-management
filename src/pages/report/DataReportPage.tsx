import { useCallback, useEffect, useState } from 'react'
import { Download, SlidersHorizontal } from 'lucide-react'
import { reportApi } from '@/mock/api'
import type { DataReportEntry, ReportCategory, ReportPeriod, PaginatedResult, SearchParams } from '@/types'
import { formatCurrency } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'

const categoryTabs: { key: ReportCategory; label: string }[] = [
  { key: 'operations', label: '业务运营' },
  { key: 'distribution', label: '分销合作' },
  { key: 'finance', label: '财务收入' },
  { key: 'sales', label: '产品销售' },
]

export default function DataReportPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<DataReportEntry>>({ data: [], total: 0, page: 1, pageSize: 12 })
  
  const [category, setCategory] = useState<ReportCategory>('operations')
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [keyword, setKeyword] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 12, category, period }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    const result = await reportApi.list(params)
    setData(result)
    setLoading(false)
  }, [category, period, keyword, dateFrom, dateTo])

  useEffect(() => { fetchData() }, [fetchData])

  const handleReset = () => {
    setKeyword('')
    setPeriod('month')
    setDateFrom('')
    setDateTo('')
  }

  const handleExport = () => {
    alert('正在生成报表导出文件...')
  }

  const renderTableHeaders = () => {
    return (
      <tr className="border-b border-gray-200 bg-gray-50">
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">时间维度</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">报表名称</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">关键对象 (航线/产品/渠道)</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">航次号</th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">指标A (数量/占比)</th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">指标B (数量/占比)</th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">指标C (金额)</th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">指标D (金额)</th>
      </tr>
    )
  }

  return (
    <div>
      <PageHeader title="数据报表" description="多维度的数据统计与报表导出中心。" />

      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {categoryTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setCategory(tab.key); setKeyword(''); setDateFrom(''); setDateTo('') }}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${category === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <SearchPanel onSearch={() => fetchData(1)} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">统计周期</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value as ReportPeriod)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="day">按日</option>
            <option value="week">按周</option>
            <option value="month">按月</option>
            <option value="quarter">按季</option>
            <option value="year">按年</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">日期范围 (起始)</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">日期范围 (结束)</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关联筛选</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="航线/产品/渠道名称" className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </SearchPanel>
      <div className="bg-white px-9 py-6">
        <div className="flex gap-3">
          <button onClick={() => alert('自定义报表功能开发中')} className="inline-flex h-11 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-6 text-base text-gray-700 transition hover:bg-gray-50">
            <SlidersHorizontal className="w-4 h-4" />
            自定义报表
          </button>
          <button onClick={handleExport} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {renderTableHeaders()}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
              ) : data.data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-700">{record.dateLabel}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{record.reportName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {record.routeName && <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded mr-1 mb-1 text-[11px] text-gray-600">{record.routeName}</span>}
                    {record.productName && <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded mr-1 mb-1 text-[11px] text-gray-600">{record.productName}</span>}
                    {record.dealerName && <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded mr-1 mb-1 text-[11px] text-gray-600">{record.dealerName}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">{record.voyageNo || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{record.metricA.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{record.metricB.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(record.metricC)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(record.metricD)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">共 {data.total} 条</span>
            <div className="flex items-center gap-1">
              <button onClick={() => fetchData(data.page - 1)} disabled={data.page <= 1} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">上一页</button>
              <button onClick={() => fetchData(data.page + 1)} disabled={data.page >= Math.ceil(data.total / data.pageSize)} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
