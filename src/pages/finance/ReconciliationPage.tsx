import { useCallback, useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import { reconciliationApi, dealerApi } from '@/mock/api'
import type { ReconciliationBatch, ReconciliationBatchForm, ReconciliationChannelType, ReconciliationStatus, PaginatedResult, SearchParams, Dealer } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import StatusBadge from '@/components/common/StatusBadge'

const channelTypeLabels: Record<ReconciliationChannelType, string> = { ota: 'OTA', distribution: '同业分销' }
const diffTypeLabels: Record<string, string> = { amount: '金额差异', time: '时间差异', missing_order: '无对应订单', missing_bank: '无对应流水' }

export default function ReconciliationPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<ReconciliationBatch>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [channelTypeFilter, setChannelTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<ReconciliationBatchForm>({ dealerId: '', reconcileDate: '', bankFileName: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [dealers, setDealers] = useState<Dealer[]>([])

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<ReconciliationBatch | null>(null)
  
  const [handlingDiffId, setHandlingDiffId] = useState<string | null>(null)
  const [handleRemark, setHandleRemark] = useState('')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (channelTypeFilter !== 'all') params.channelType = channelTypeFilter
    if (statusFilter !== 'all') params.status = statusFilter
    const result = await reconciliationApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, channelTypeFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (formOpen && dealers.length === 0) {
      dealerApi.list({ pageSize: 100 }).then(res => setDealers(res.data.filter(d => d.status === 'cooperating')))
    }
  }, [formOpen, dealers.length])

  const handleReset = () => {
    setKeyword('')
    setChannelTypeFilter('all')
    setStatusFilter('all')
  }

  const openCreate = () => {
    setForm({ dealerId: '', reconcileDate: new Date().toISOString().slice(0, 10), bankFileName: '' })
    setFormOpen(true)
  }

  const openDetail = async (record: ReconciliationBatch) => {
    const result = await reconciliationApi.getById(record.id)
    setDetail(result || null)
    setHandlingDiffId(null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.dealerId || !form.reconcileDate || !form.bankFileName) return
    setFormLoading(true)
    const selectedDealer = dealers.find(d => d.id === form.dealerId)
    await reconciliationApi.create({
      batchNo: `REC${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 8)}${Math.floor(Math.random() * 900 + 100)}`,
      dealerId: form.dealerId,
      dealerName: selectedDealer?.name || '未知渠道',
      channelType: selectedDealer?.channelTypes[0] === 'ota' ? 'ota' : 'distribution',
      reconcileDate: form.reconcileDate,
      bankFileName: form.bankFileName,
      totalCount: 100, // mock data
      matchedCount: 95,
      diffCount: 5,
      matchRate: 95,
      handler: '当前用户',
      status: 'diff_pending',
      differences: [
        { id: '1', orderNo: 'ORD20260510001', tradeTime: '2026-05-10 10:00:00', channelAmount: 1500, bankAmount: 1400, diffAmount: -100, diffType: 'amount', remark: '', handled: false },
        { id: '2', orderNo: 'ORD20260510002', tradeTime: '2026-05-10 11:30:00', channelAmount: 2000, bankAmount: 2000, diffAmount: 0, diffType: 'time', remark: '', handled: false }
      ],
      updatedBy: '当前用户',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    })
    setFormLoading(false)
    setFormOpen(false)
    fetchData(1)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm({ ...form, bankFileName: file.name })
    }
  }

  const submitDiffHandle = async (diffId: string) => {
    if (!detail || !handleRemark.trim()) return
    const updated = await reconciliationApi.markDifferenceHandled(detail.id, diffId, handleRemark.trim())
    if (updated) {
      setDetail(updated)
      setHandlingDiffId(null)
      setHandleRemark('')
      fetchData(data.page)
    }
  }

  return (
    <div>
      <PageHeader title="对账批次" description="管理 OTA 与同业分销渠道的银行流水对账与差异处理。">
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
          <Upload className="w-4 h-4" />
          上传流水对账
        </button>
      </PageHeader>

      <SearchPanel onSearch={() => fetchData(1)} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="批次号/渠道名称" className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">渠道类型</label>
          <select value={channelTypeFilter} onChange={(e) => setChannelTypeFilter(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            <option value="ota">OTA</option>
            <option value="distribution">同业分销</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">对账状态</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            <option value="pending_check">待勾稽</option>
            <option value="reconciled">已对账</option>
            <option value="diff_pending">差异待处理</option>
            <option value="diff_resolved">差异已处理</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">批次号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">渠道名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">对账日期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">总笔数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">已匹配</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">差异笔数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">匹配率</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">操作人</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
              ) : data.data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{record.batchNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>{record.dealerName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{channelTypeLabels[record.channelType]}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.reconcileDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.totalCount}</td>
                  <td className="px-4 py-3 text-sm text-green-600 font-medium">{record.matchedCount}</td>
                  <td className="px-4 py-3 text-sm text-red-600 font-medium">{record.diffCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.matchRate}%</td>
                  <td className="px-4 py-3 text-sm text-gray-700"><StatusBadge status={record.status as any} /></td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.handler}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(record)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">详情</button>
                  </td>
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

      <FormDialog open={formOpen} title="新建对账批次" width="max-w-md" loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">对账渠道 <span className="text-red-500">*</span></label>
            <select value={form.dealerId} onChange={(e) => setForm({ ...form, dealerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">请选择渠道</option>
              {dealers.map(d => <option key={d.id} value={d.id}>{d.name} ({channelTypeLabels[d.channelTypes[0] as ReconciliationChannelType] || '渠道'})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">对账日期 <span className="text-red-500">*</span></label>
            <input type="date" value={form.reconcileDate} onChange={(e) => setForm({ ...form, reconcileDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">银行流水文件 <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-3">
              <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            {form.bankFileName && <p className="mt-2 text-xs text-gray-500">已选择: {form.bankFileName} (系统将自动解析并在创建后执行对账勾稽)</p>}
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title={`对账批次详情 - ${detail?.batchNo}`} width="w-[840px]" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">总笔数</div>
                <div className="text-xl font-semibold text-gray-900">{detail.totalCount}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-xs text-green-600 mb-1">已匹配</div>
                <div className="text-xl font-semibold text-green-700">{detail.matchedCount}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-xs text-red-600 mb-1">差异笔数</div>
                <div className="text-xl font-semibold text-red-700">{detail.diffCount}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xs text-blue-600 mb-1">匹配率</div>
                <div className="text-xl font-semibold text-blue-700">{detail.matchRate}%</div>
              </div>
            </div>

            <DetailCard title="批次基础信息">
              <DetailRow label="批次流水号" value={detail.batchNo} mono />
              <DetailRow label="渠道名称" value={detail.dealerName} />
              <DetailRow label="对账日期" value={detail.reconcileDate} />
              <DetailRow label="当前状态" value={<StatusBadge status={detail.status as any} />} />
              <DetailRow label="流水文件名" value={detail.bankFileName} />
              <DetailRow label="操作人" value={detail.handler} />
            </DetailCard>
            
            {detail.differences.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
                  <span>差异明细 ({detail.differences.length})</span>
                  {detail.status === 'diff_resolved' && <span className="text-xs text-green-600 font-normal">全部差异已处理完成</span>}
                </h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                        <th className="px-4 py-2 font-medium">订单号</th>
                        <th className="px-4 py-2 font-medium">渠道金额</th>
                        <th className="px-4 py-2 font-medium">银行金额</th>
                        <th className="px-4 py-2 font-medium">差异金额</th>
                        <th className="px-4 py-2 font-medium">差异类型</th>
                        <th className="px-4 py-2 font-medium">处理状态</th>
                        <th className="px-4 py-2 font-medium w-48">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.differences.map(diff => (
                        <tr key={diff.id} className="text-sm hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-gray-600">
                            <div>{diff.orderNo}</div>
                            <div className="text-[10px] text-gray-400">{diff.tradeTime}</div>
                          </td>
                          <td className="px-4 py-2">{formatCurrency(diff.channelAmount)}</td>
                          <td className="px-4 py-2">{formatCurrency(diff.bankAmount)}</td>
                          <td className={`px-4 py-2 font-medium ${diff.diffAmount > 0 ? 'text-green-600' : diff.diffAmount < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {diff.diffAmount > 0 ? '+' : ''}{formatCurrency(diff.diffAmount)}
                          </td>
                          <td className="px-4 py-2">{diffTypeLabels[diff.diffType] || diff.diffType}</td>
                          <td className="px-4 py-2">
                            {diff.handled ? (
                              <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>已处理
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-500 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>待处理
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {diff.handled ? (
                              <div className="text-xs text-gray-500 truncate" title={diff.remark}>备注: {diff.remark}</div>
                            ) : handlingDiffId === diff.id ? (
                              <div className="flex flex-col gap-1.5">
                                <input value={handleRemark} onChange={e => setHandleRemark(e.target.value)} placeholder="输入处理备注" className="w-full px-2 py-1 border border-gray-300 rounded text-xs" autoFocus />
                                <div className="flex items-center gap-1">
                                  <button onClick={() => submitDiffHandle(diff.id)} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">确认</button>
                                  <button onClick={() => { setHandlingDiffId(null); setHandleRemark('') }} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200">取消</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setHandlingDiffId(diff.id); setHandleRemark('') }} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">处理差异</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </DetailDrawer>
    </div>
  )
}
