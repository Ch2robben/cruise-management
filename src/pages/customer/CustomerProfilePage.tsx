import { useCallback, useEffect, useState } from 'react'
import { customerProfileApi } from '@/mock/api'
import type { CustomerProfile, CustomerProfileForm, CustomerLevel, CustomerSourceChannel, PaginatedResult, SearchParams } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import StatusBadge from '@/components/common/StatusBadge'

const levelLabels: Record<CustomerLevel, string> = { vip: 'VIP', advanced: '高级', normal: '普通', potential: '潜在' }
const sourceChannelLabels: Record<CustomerSourceChannel, string> = { ota: 'OTA', official: '直销', offline: '线下', onboard: '船上' }

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<CustomerProfile>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [sourceChannelFilter, setSourceChannelFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CustomerProfileForm>({ tags: [], level: 'normal', remark: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<CustomerProfile | null>(null)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (levelFilter !== 'all') params.level = levelFilter
    if (sourceChannelFilter !== 'all') params.sourceChannel = sourceChannelFilter
    const result = await customerProfileApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, levelFilter, sourceChannelFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleReset = () => {
    setKeyword('')
    setLevelFilter('all')
    setSourceChannelFilter('all')
  }

  const openEdit = (record: CustomerProfile) => {
    setEditingId(record.id)
    setForm({
      tags: [...record.tags],
      level: record.level,
      remark: record.remark,
    })
    setTagInput('')
    setFormOpen(true)
  }

  const openDetail = async (record: CustomerProfile) => {
    const result = await customerProfileApi.getById(record.id)
    setDetail(result || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!editingId) return
    setFormLoading(true)
    await customerProfileApi.update(editingId, { ...form, updatedBy: '当前用户', updatedAt: new Date().toISOString() })
    setFormLoading(false)
    setFormOpen(false)
    fetchData(data.page)
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) })
  }

  return (
    <div>
      <PageHeader title="客户档案" description="管理客户基础信息、消费行为、偏好标签及历史订单与客诉记录。" />

      <SearchPanel onSearch={() => fetchData(1)} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="姓名/手机号/证件号" className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">客户等级</label>
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            <option value="vip">VIP</option>
            <option value="advanced">高级</option>
            <option value="normal">普通</option>
            <option value="potential">潜在</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">来源渠道</label>
          <select value={sourceChannelFilter} onChange={(e) => setSourceChannelFilter(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            <option value="ota">OTA</option>
            <option value="official">直销</option>
            <option value="offline">线下</option>
            <option value="onboard">船上</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">客户姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">联系方式</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">客户等级</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">来源渠道</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">消费总额</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">航行次数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">最近航行</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
              ) : data.data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{record.name}</div>
                    <div className="text-xs text-gray-400 font-mono mt-1">{record.idCard}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{levelLabels[record.level]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{sourceChannelLabels[record.sourceChannel]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(record.totalAmount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.voyageCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.lastVoyageDate || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(record)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
                      <button onClick={() => openEdit(record)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
                    </div>
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

      <FormDialog open={formOpen} title="编辑客户特征" width="max-w-md" loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">客户等级</label>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as CustomerLevel })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="vip">VIP</option>
              <option value="advanced">高级</option>
              <option value="normal">普通</option>
              <option value="potential">潜在</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">客户标签</label>
            <div className="flex gap-2 mb-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }} placeholder="输入标签按回车添加" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button type="button" onClick={handleAddTag} className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">添加</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="text-blue-400 hover:text-blue-600">&times;</button>
                </span>
              ))}
              {form.tags.length === 0 && <span className="text-xs text-gray-400">暂无标签</span>}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">备注说明</label>
            <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="输入备注信息" />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="客户详情" width="w-[680px]" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基本信息">
              <DetailRow label="客户姓名" value={detail.name} />
              <DetailRow label="性别" value={detail.gender} />
              <DetailRow label="出生日期" value={detail.birthday || '-'} />
              <DetailRow label="联系电话" value={detail.phone} />
              <DetailRow label="证件号码" value={detail.idCard} mono />
              <DetailRow label="国籍/地区" value={detail.nationality} />
              <DetailRow label="客源地" value={detail.origin} />
              <DetailRow label="来源渠道" value={sourceChannelLabels[detail.sourceChannel]} />
            </DetailCard>
            <DetailCard title="特征分析">
              <DetailRow label="客户等级" value={levelLabels[detail.level]} />
              <DetailRow label="消费总额" value={formatCurrency(detail.totalAmount)} />
              <DetailRow label="航行总次数" value={detail.voyageCount} />
              <DetailRow label="最近一次航行" value={detail.lastVoyageDate || '-'} />
              <DetailRow label="偏好航线" value={detail.favoriteRoute || '-'} />
              <DetailRow label="偏好房型" value={detail.favoriteCabin || '-'} />
              <DetailRow label="客户标签" value={
                detail.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">{tag}</span>
                    ))}
                  </div>
                ) : '-'
              } />
              <DetailRow label="备注说明" value={detail.remark || '-'} />
            </DetailCard>
            
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">历史订单 ({detail.orderHistory.length})</h4>
              {detail.orderHistory.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                        <th className="px-4 py-2 font-medium">订单号</th>
                        <th className="px-4 py-2 font-medium">产品名称</th>
                        <th className="px-4 py-2 font-medium">航期</th>
                        <th className="px-4 py-2 font-medium">金额</th>
                        <th className="px-4 py-2 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.orderHistory.map(order => (
                        <tr key={order.id} className="text-sm">
                          <td className="px-4 py-2 font-mono text-gray-600">{order.orderNo}</td>
                          <td className="px-4 py-2">{order.productName}</td>
                          <td className="px-4 py-2">{order.voyageDate}</td>
                          <td className="px-4 py-2">{formatCurrency(order.amount)}</td>
                          <td className="px-4 py-2">{order.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">暂无历史订单</div>
              )}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">关联客诉 ({detail.relatedTickets.length})</h4>
              {detail.relatedTickets.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                        <th className="px-4 py-2 font-medium">工单号</th>
                        <th className="px-4 py-2 font-medium">类型</th>
                        <th className="px-4 py-2 font-medium">创建时间</th>
                        <th className="px-4 py-2 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.relatedTickets.map(ticket => (
                        <tr key={ticket.id} className="text-sm">
                          <td className="px-4 py-2 font-mono text-gray-600">{ticket.ticketNo}</td>
                          <td className="px-4 py-2">{ticket.type === 'complaint' ? '投诉' : ticket.type === 'consult' ? '咨询' : '退款'}</td>
                          <td className="px-4 py-2">{formatDateTime(ticket.createdAt)}</td>
                          <td className="px-4 py-2"><StatusBadge status={ticket.status as any} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">暂无关联客诉</div>
              )}
            </div>
          </>
        )}
      </DetailDrawer>
    </div>
  )
}
