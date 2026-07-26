import { useMemo, useState } from 'react'
import { Link2, Plus } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { products } from '@/mock/data'
import {
  additionalProductCategories,
  getAdditionalCategoryPath,
  initialAdditionalProducts,
} from '@/mock/additionalProducts'
import type { AdditionalProduct, AdditionalProductForm } from '@/types'
import { formatCurrency } from '@/utils/format'

const emptyForm: AdditionalProductForm = {
  categoryId: 'apc-hotel',
  name: '',
  required: false,
  chargeMethod: 'per_person',
  amount: 0,
  sourceType: 'external',
  sourceName: '',
  externalCode: '',
  relatedProductIds: [],
}

const childCategories = additionalProductCategories.filter((item) => item.level === 2 && item.status === 'enabled')

export default function AdditionalProductPage() {
  const [rows, setRows] = useState<AdditionalProduct[]>(() => [...initialAdditionalProducts])
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [chargeMethod, setChargeMethod] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [relationOpen, setRelationOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AdditionalProductForm>(emptyForm)
  const [deleteId, setDeleteId] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  const commitRows = (next: AdditionalProduct[]) => {
    setRows(next)
    initialAdditionalProducts.splice(0, initialAdditionalProducts.length, ...next)
  }

  const filteredRows = useMemo(() => rows.filter((item) => {
    if (keyword.trim() && !`${item.name}${item.externalCode}${item.sourceName}`.toLowerCase().includes(keyword.trim().toLowerCase())) return false
    if (categoryId !== 'all' && item.categoryId !== categoryId) return false
    if (chargeMethod !== 'all' && item.chargeMethod !== chargeMethod) return false
    return true
  }), [rows, keyword, categoryId, chargeMethod])

  const startCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setFormOpen(true)
  }

  const startEdit = (record: AdditionalProduct) => {
    setEditingId(record.id)
    setForm({
      categoryId: record.categoryId,
      name: record.name,
      required: record.required,
      chargeMethod: record.chargeMethod,
      amount: record.amount,
      sourceType: record.sourceType,
      sourceName: record.sourceName,
      externalCode: record.externalCode,
      relatedProductIds: [...record.relatedProductIds],
    })
    setFormOpen(true)
  }

  const startRelation = (record: AdditionalProduct) => {
    startEdit(record)
    setFormOpen(false)
    setRelationOpen(true)
  }

  const saveForm = () => {
    if (!form.name.trim() || !form.categoryId || form.amount < 0) {
      showToast('请完整填写名称、二级分类和有效金额')
      return
    }
    const now = new Date().toLocaleString('zh-CN', { hour12: false })
    if (editingId) {
      commitRows(rows.map((item) => item.id === editingId ? { ...item, ...form, updatedAt: now, updatedBy: '当前用户' } : item))
    } else {
      commitRows([{ id: `ap${Date.now()}`, ...form, status: 'enabled', updatedAt: now, updatedBy: '当前用户', createdAt: now }, ...rows])
    }
    setFormOpen(false)
    showToast(editingId ? '附加产品已更新' : '附加产品已新增')
  }

  const saveRelation = () => {
    if (!editingId) return
    commitRows(rows.map((item) => item.id === editingId ? { ...item, relatedProductIds: [...form.relatedProductIds] } : item))
    setRelationOpen(false)
    showToast(`已关联 ${form.relatedProductIds.length} 个产品`)
  }

  const toggleProduct = (productId: string) => {
    setForm((current) => ({
      ...current,
      relatedProductIds: current.relatedProductIds.includes(productId)
        ? current.relatedProductIds.filter((id) => id !== productId)
        : [...current.relatedProductIds, productId],
    }))
  }

  const toggleStatus = (id: string) => {
    commitRows(rows.map((item) => item.id === id ? { ...item, status: item.status === 'enabled' ? 'disabled' : 'enabled' } : item))
  }

  const columns = [
    { key: 'category', title: '一级分类 / 二级分类', width: '210px', render: (record: AdditionalProduct) => <span className="font-medium text-gray-800">{getAdditionalCategoryPath(record.categoryId)}</span> },
    { key: 'name', title: '附加产品名称', render: (record: AdditionalProduct) => <div><div className="font-medium text-gray-900">{record.name}</div><div className="mt-1 text-xs text-gray-400">{record.externalCode || '内部产品'}</div></div> },
    { key: 'required', title: '是否必收', width: '100px', render: (record: AdditionalProduct) => <span className={`rounded px-2 py-0.5 text-xs ${record.required ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{record.required ? '必收' : '可选'}</span> },
    { key: 'chargeMethod', title: '收取方式', width: '100px', render: (record: AdditionalProduct) => record.chargeMethod === 'per_person' ? '按人' : '按房' },
    { key: 'amount', title: '金额', width: '110px', render: (record: AdditionalProduct) => <span className="font-medium tabular-nums">{formatCurrency(record.amount)}</span> },
    { key: 'source', title: '数据来源', width: '160px', render: (record: AdditionalProduct) => <div><div>{record.sourceName || '-'}</div><div className={`mt-1 text-xs ${record.sourceType === 'external' ? 'text-blue-600' : 'text-gray-400'}`}>{record.sourceType === 'external' ? '外部数据' : '内部数据'}</div></div> },
    { key: 'relations', title: '关联产品', width: '120px', render: (record: AdditionalProduct) => <button onClick={() => startRelation(record)} className="inline-flex items-center gap-1 text-blue-600 hover:underline"><Link2 className="h-3.5 w-3.5" />{record.relatedProductIds.length} 个产品</button> },
    { key: 'status', title: '状态', width: '90px', render: (record: AdditionalProduct) => <StatusBadge status={record.status} /> },
    { key: 'actions', title: '操作', width: '180px', render: (record: AdditionalProduct) => <div className="flex items-center gap-1"><button onClick={() => startEdit(record)} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">编辑</button><button onClick={() => toggleStatus(record.id)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">{record.status === 'enabled' ? '停用' : '启用'}</button><button onClick={() => setDeleteId(record.id)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">删除</button></div> },
  ]

  return (
    <div>
      {toast && <div className="fixed left-1/2 top-6 z-[70] -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
      <PageHeader title="附加产品管理" description="维护酒店、餐费、门票等附加服务，通过二级分类管理并关联可售主产品。" />
      <SearchPanel onSearch={() => undefined} onReset={() => { setKeyword(''); setCategoryId('all'); setChargeMethod('all') }}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="名称 / 外部编码 / 来源" className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">二级分类</label><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="all">全部分类</option>{childCategories.map((item) => <option key={item.id} value={item.id}>{getAdditionalCategoryPath(item.id)}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">收取方式</label><select value={chargeMethod} onChange={(event) => setChargeMethod(event.target.value)} className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="all">全部</option><option value="per_person">按人</option><option value="per_room">按房</option></select></div>
      </SearchPanel>
      <div className="bg-white px-9 py-6"><button onClick={startCreate} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" />新增附加产品</button></div>
      <DataTable columns={columns} dataSource={filteredRows} rowKey="id" emptyText="暂无符合条件的附加产品" />

      <FormDialog open={formOpen} title={editingId ? '编辑附加产品' : '新增附加产品'} width="max-w-2xl" onCancel={() => setFormOpen(false)} onSubmit={saveForm}>
        <div className="grid grid-cols-2 gap-4 p-2">
          <div><label className="mb-1 block text-sm text-gray-700">二级分类 <span className="text-red-500">*</span></label><select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{childCategories.map((item) => <option key={item.id} value={item.id}>{getAdditionalCategoryPath(item.id)}</option>)}</select></div>
          <div><label className="mb-1 block text-sm text-gray-700">名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm text-gray-700">收取方式 <span className="text-red-500">*</span></label><select value={form.chargeMethod} onChange={(event) => setForm({ ...form, chargeMethod: event.target.value as AdditionalProductForm['chargeMethod'] })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="per_person">按人</option><option value="per_room">按房</option></select></div>
          <div><label className="mb-1 block text-sm text-gray-700">金额（元） <span className="text-red-500">*</span></label><input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm text-gray-700">数据类型</label><select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value as AdditionalProductForm['sourceType'] })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="external">外部数据</option><option value="internal">内部数据</option></select></div>
          <div><label className="mb-1 block text-sm text-gray-700">来源系统</label><input value={form.sourceName} onChange={(event) => setForm({ ...form, sourceName: event.target.value })} placeholder="如：景区票务平台" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm text-gray-700">外部编码</label><input value={form.externalCode} onChange={(event) => setForm({ ...form, externalCode: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <label className="mt-7 flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.required} onChange={(event) => setForm({ ...form, required: event.target.checked })} className="rounded text-blue-600" />设为必收项目</label>
        </div>
      </FormDialog>

      <FormDialog open={relationOpen} title="关联主产品" width="max-w-4xl" onCancel={() => setRelationOpen(false)} onSubmit={saveRelation} submitText="保存关联">
        <div className="mb-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">只有已关联且启用的附加产品，才会出现在经销商对应产品的下单页面。</div>
        <div className="grid max-h-[420px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {products.map((product) => <label key={product.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50"><input type="checkbox" checked={form.relatedProductIds.includes(product.id)} onChange={() => toggleProduct(product.id)} className="mt-1 rounded text-blue-600" /><span><span className="block text-sm font-medium text-gray-800">{product.name}</span><span className="mt-0.5 block text-xs text-gray-500">{product.routeName}</span></span></label>)}
        </div>
      </FormDialog>

      <ConfirmDialog open={Boolean(deleteId)} title="删除附加产品" message="删除后经销商下单将无法再选择该项目，确定继续吗？" danger onCancel={() => setDeleteId('')} onConfirm={() => { commitRows(rows.filter((item) => item.id !== deleteId)); setDeleteId(''); showToast('附加产品已删除') }} />
    </div>
  )
}
