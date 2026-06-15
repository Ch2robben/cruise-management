import { useState, useEffect, useCallback } from 'react'
import { Plus, Minus } from 'lucide-react'
import { approvalFlowApi } from '@/mock/api'
import type { ApprovalFlow, ApprovalFlowForm, PaginatedResult } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const businessTypes = [
  '产品与价格发布',
  '退票审批',
  '分销商授信审批',
  '分销商退款审批',
  '分销商合作审批',
  '分销商价格政策',
  '分销商退改政策',
  'OTA价格调整',
]

const emptyForm: ApprovalFlowForm = {
  businessType: '',
  status: 'enabled',
  levels: [{ levelNo: 1, nodeName: '', approvers: [] }],
}

export default function ApprovalFlowPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<ApprovalFlow>>({ data: [], total: 0, page: 1, pageSize: 10 })

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ApprovalFlowForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const result = await approvalFlowApi.list({ page, pageSize: 10 })
    setData(result)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (record: ApprovalFlow) => {
    setEditingId(record.id)
    setFormData({
      businessType: record.businessType,
      status: record.status,
      levels: record.levels.map(l => ({ ...l })),
    })
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.businessType) return alert('请选择审批业务')
    if (formData.levels.length === 0) return alert('至少需要一级审批')
    for (const lvl of formData.levels) {
      if (!lvl.nodeName) return alert(`请输入第 ${lvl.levelNo} 级审批的节点名称（如“操作部”）`)
      if (lvl.approvers.length === 0 || !lvl.approvers[0].trim()) return alert(`请输入第 ${lvl.levelNo} 级审批的审批人员`)
    }

    setFormLoading(true)
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const payload = {
      ...formData,
      levels: formData.levels.map((l, idx) => ({ ...l, levelNo: idx + 1 })),
      updatedBy: '当前用户',
      updatedAt: now,
    }

    if (editingId) {
      await approvalFlowApi.update(editingId, payload)
    } else {
      await approvalFlowApi.create({ ...payload, createdAt: now } as ApprovalFlow)
    }
    setFormLoading(false)
    setFormOpen(false)
    fetchData(data.page)
  }

  const handleDelete = (id: string) => { setConfirmId(id); setConfirmOpen(true) }
  const confirmDelete = async () => {
    await approvalFlowApi.remove(confirmId)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  const addLevel = () => {
    if (formData.levels.length >= 3) return
    setFormData({
      ...formData,
      levels: [...formData.levels, { levelNo: formData.levels.length + 1, nodeName: '', approvers: [] }],
    })
  }

  const removeLevel = (index: number) => {
    const newLevels = formData.levels.filter((_, i) => i !== index).map((l, i) => ({ ...l, levelNo: i + 1 }))
    setFormData({ ...formData, levels: newLevels })
  }

  const columns = [
    { key: 'businessType', title: '审批类型', dataIndex: 'businessType' as keyof ApprovalFlow },
    { 
      key: 'process', 
      title: '审批流程', 
      render: (r: ApprovalFlow) => (
        <span className="text-gray-700">
          {r.levels.map(l => `${l.nodeName}（${l.approvers.join(', ')}）`).join(' ➔ ')}
        </span>
      )
    },
    { 
      key: 'status', 
      title: '状态', 
      render: (r: ApprovalFlow) => (
        <span className={r.status === 'enabled' ? 'text-green-600' : 'text-gray-500'}>
          {r.status === 'enabled' ? '已开启' : '已关闭'}
        </span>
      ) 
    },
    { key: 'updatedBy', title: '编辑人员', dataIndex: 'updatedBy' as keyof ApprovalFlow },
    { key: 'updatedAt', title: '编辑时间', dataIndex: 'updatedAt' as keyof ApprovalFlow },
    { 
      key: 'actions', 
      title: '操作', 
      width: '120px', 
      render: (r: ApprovalFlow) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEdit(r)} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">编辑</button>
          <button onClick={() => handleDelete(r.id)} className="text-sm text-red-600 hover:text-red-800 transition-colors">删除</button>
        </div>
      )
    },
  ]

  const levelLabels = ['一', '二', '三']

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <PageHeader title="审批流配置" />
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <button 
              onClick={openCreate} 
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              新增
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <DataTable 
              columns={columns} 
              dataSource={data.data} 
              loading={loading} 
              rowKey="id" 
              pagination={{ 
                current: data.page, 
                pageSize: data.pageSize, 
                total: data.total, 
                onChange: fetchData 
              }} 
            />
          </div>
        </div>
      </div>

      <FormDialog 
        open={formOpen} 
        title="审批设置" 
        width="max-w-2xl" 
        loading={formLoading} 
        onCancel={() => setFormOpen(false)} 
        onSubmit={handleSubmit}
      >
        <div className="space-y-6 pb-8">
          <div className="flex items-center gap-4">
            <label className="w-20 text-sm font-medium text-gray-700 flex-shrink-0 text-right">审批业务</label>
            <select 
              value={formData.businessType} 
              onChange={e => setFormData({ ...formData, businessType: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">选择审批类型</option>
              {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-20 text-sm font-medium text-gray-700 flex-shrink-0 text-right">开启审批</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: formData.status === 'enabled' ? 'disabled' : 'enabled' })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.status === 'enabled' ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status === 'enabled' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-20 pt-2 text-sm font-medium text-gray-700 flex-shrink-0 text-right">审批流程</div>
            <div className="flex-1 space-y-4 relative">
              {formData.levels.map((level, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-gray-600">
                    {levelLabels[index]}级审批
                  </div>
                  <input
                    type="text"
                    placeholder="节点 (如: 操作部)"
                    value={level.nodeName}
                    onChange={e => {
                      const newLevels = [...formData.levels]
                      newLevels[index].nodeName = e.target.value
                      setFormData({ ...formData, levels: newLevels })
                    }}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="审批人员 (逗号分隔)"
                    value={level.approvers.join(', ')}
                    onChange={e => {
                      const newLevels = [...formData.levels]
                      const val = e.target.value
                      newLevels[index].approvers = val ? val.split(',').map(s => s.trim()) : []
                      setFormData({ ...formData, levels: newLevels })
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {index === formData.levels.length - 1 && formData.levels.length < 3 ? (
                    <button type="button" onClick={addLevel} className="text-gray-400 hover:text-blue-600 transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  ) : index > 0 ? (
                    <button type="button" onClick={() => removeLevel(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Minus className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="w-5" />
                  )}
                </div>
              ))}
              
              <div className="absolute right-0 top-full mt-4 p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100 shadow-sm w-[220px]">
                支持最多三级审批，每级审批需指定多个审批人员。<br />同一级只要有一个人审批即可。
              </div>
            </div>
          </div>

        </div>
      </FormDialog>

      <ConfirmDialog 
        open={confirmOpen} 
        title="删除确认" 
        message="确定要删除该审批流配置吗？" 
        danger 
        onConfirm={confirmDelete} 
        onCancel={() => setConfirmOpen(false)} 
      />
    </div>
  )
}
