import { useMemo, useState } from 'react'
import { Eye, Plus } from 'lucide-react'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import DataTable from '@/components/common/DataTable'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import FormDialog from '@/components/common/FormDialog'
import PageHeader from '@/components/common/PageHeader'
import RichTextEditor, { RichTextContent } from '@/components/common/RichTextEditor'
import SearchPanel from '@/components/common/SearchPanel'
import StatusBadge from '@/components/common/StatusBadge'
import { formatDateTime, generateId } from '@/utils/format'

type PolicyContentCategory = 'booking_rule' | 'change_refund_rule' | 'new_route' | 'new_product'
type PolicyContentStatus = 'draft' | 'published' | 'disabled'

interface PolicyContent {
  id: string
  title: string
  category: PolicyContentCategory
  summary: string
  content: string
  status: PolicyContentStatus
  sort: number
  updatedBy: string
  updatedAt: string
  publishedAt: string
}

type PolicyContentForm = Pick<
  PolicyContent,
  'title' | 'category' | 'summary' | 'content' | 'status' | 'sort'
>

const categoryOptions: Array<{ value: PolicyContentCategory; label: string }> = [
  { value: 'booking_rule', label: '预订规则' },
  { value: 'change_refund_rule', label: '退改规则' },
  { value: 'new_route', label: '新航线' },
  { value: 'new_product', label: '新产品介绍' },
]

const categoryClass: Record<PolicyContentCategory, string> = {
  booking_rule: 'bg-blue-50 text-blue-700',
  change_refund_rule: 'bg-orange-50 text-orange-700',
  new_route: 'bg-teal-50 text-teal-700',
  new_product: 'bg-purple-50 text-purple-700',
}

const initialContents: PolicyContent[] = [
  {
    id: 'policy-content-001',
    title: '长江游轮产品预订须知',
    category: 'booking_rule',
    summary: '说明预订信息填写、舱房选择、定金支付及订单保留要求。',
    content:
      '<p><b>预订前请确认航次、房型及入住人数。</b></p><ol><li>旅客姓名和证件信息须与有效证件一致。</li><li>提交订单后，请在订单有效期内完成定金支付。</li><li>儿童、婴儿及加床需求以对应票类和房型规则为准。</li></ol>',
    status: 'published',
    sort: 10,
    updatedBy: '系统管理员',
    updatedAt: '2026-07-26T09:30:00',
    publishedAt: '2026-07-20T10:00:00',
  },
  {
    id: 'policy-content-002',
    title: '订单退改及取消说明',
    category: 'change_refund_rule',
    summary: '展示订单退改申请入口、费用计算口径及审核结果说明。',
    content:
      '<p>订单退改费用以提交申请时匹配到的有效规则为准。</p><ul><li>已支付订单需先提交退改申请。</li><li>涉及旅客、房型或航次变更时，系统将重新校验库存及价格。</li><li>最终费用和退款金额以审核结果为准。</li></ul>',
    status: 'published',
    sort: 20,
    updatedBy: '彭琳',
    updatedAt: '2026-07-25T16:20:00',
    publishedAt: '2026-07-22T11:15:00',
  },
  {
    id: 'policy-content-003',
    title: '重庆—宜昌精品航线发布',
    category: 'new_route',
    summary: '介绍重庆至宜昌航线的主要停靠港和产品特色。',
    content:
      '<p><b>重庆—宜昌精品航线即将开放预订。</b></p><p>航线覆盖丰都、奉节、宜昌等主要停靠港，具体航次日期与行程安排以上架产品为准。</p>',
    status: 'draft',
    sort: 30,
    updatedBy: '赵昕玥',
    updatedAt: '2026-07-26T14:10:00',
    publishedAt: '',
  },
  {
    id: 'policy-content-004',
    title: '长江探索号全新套房产品介绍',
    category: 'new_product',
    summary: '展示长江探索号套房产品定位、入住组合及预订提示。',
    content:
      '<p>长江探索号套房产品现已开放销售。</p><ul><li>支持标准双人入住及单间入住。</li><li>儿童、婴儿和加床价格以航次价格配置为准。</li><li>房型数量有限，实际可售状态以下单页面为准。</li></ul>',
    status: 'published',
    sort: 40,
    updatedBy: '彭琳',
    updatedAt: '2026-07-24T11:45:00',
    publishedAt: '2026-07-24T11:45:00',
  },
  {
    id: 'policy-content-005',
    title: '特殊旅客预订信息填写说明',
    category: 'booking_rule',
    summary: '说明儿童、婴儿及其他特殊旅客的预订信息填写要求。',
    content:
      '<p>特殊旅客下单时须选择正确票类，并按页面要求填写出生日期、证件信息和监护人信息。</p>',
    status: 'disabled',
    sort: 50,
    updatedBy: '系统管理员',
    updatedAt: '2026-07-18T09:00:00',
    publishedAt: '2026-07-10T09:00:00',
  },
]

const emptyForm: PolicyContentForm = {
  title: '',
  category: 'booking_rule',
  summary: '',
  content: '',
  status: 'draft',
  sort: 0,
}

function getCategoryLabel(category: PolicyContentCategory) {
  return categoryOptions.find((item) => item.value === category)?.label || category
}

function CategoryTag({ category }: { category: PolicyContentCategory }) {
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${categoryClass[category]}`}>
      {getCategoryLabel(category)}
    </span>
  )
}

function getPlainText(html: string) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export default function RulePolicyContentPage() {
  const [records, setRecords] = useState<PolicyContent[]>(initialContents)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<'all' | PolicyContentCategory>('all')
  const [status, setStatus] = useState<'all' | PolicyContentStatus>('all')
  const [query, setQuery] = useState({
    keyword: '',
    category: 'all' as 'all' | PolicyContentCategory,
    status: 'all' as 'all' | PolicyContentStatus,
  })
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PolicyContentForm>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [preview, setPreview] = useState<PolicyContent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PolicyContent | null>(null)
  const [toast, setToast] = useState('')

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = query.keyword.trim().toLowerCase()
    return records
      .filter((item) => {
        const matchesKeyword =
          !normalizedKeyword ||
          [item.title, item.summary, getPlainText(item.content)]
            .some((value) => value.toLowerCase().includes(normalizedKeyword))
        const matchesCategory = query.category === 'all' || item.category === query.category
        const matchesStatus = query.status === 'all' || item.status === query.status
        return matchesKeyword && matchesCategory && matchesStatus
      })
      .sort((left, right) => left.sort - right.sort || right.updatedAt.localeCompare(left.updatedAt))
  }, [query, records])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  const submitSearch = () => {
    setQuery({ keyword, category, status })
    setPage(1)
  }

  const resetSearch = () => {
    setKeyword('')
    setCategory('all')
    setStatus('all')
    setQuery({ keyword: '', category: 'all', status: 'all' })
    setPage(1)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (record: PolicyContent) => {
    setEditingId(record.id)
    setForm({
      title: record.title,
      category: record.category,
      summary: record.summary,
      content: record.content,
      status: record.status,
      sort: record.sort,
    })
    setErrors({})
    setFormOpen(true)
  }

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.title.trim()) nextErrors.title = '请输入标题'
    if (form.title.trim().length > 60) nextErrors.title = '标题最多 60 个字符'
    if (form.summary.length > 120) nextErrors.summary = '摘要最多 120 个字符'
    if (!getPlainText(form.content)) nextErrors.content = '请输入正文内容'
    if (!Number.isFinite(form.sort) || form.sort < 0 || form.sort > 999) {
      nextErrors.sort = '排序值须为 0 至 999'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submitForm = () => {
    if (!validateForm()) return
    const now = new Date().toISOString()

    if (editingId) {
      setRecords((previous) =>
        previous.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...form,
                title: form.title.trim(),
                summary: form.summary.trim(),
                updatedBy: '当前用户',
                updatedAt: now,
                publishedAt: form.status === 'published' ? item.publishedAt || now : item.publishedAt,
              }
            : item,
        ),
      )
      showToast('内容已更新')
    } else {
      setRecords((previous) => [
        {
          id: generateId(),
          ...form,
          title: form.title.trim(),
          summary: form.summary.trim(),
          updatedBy: '当前用户',
          updatedAt: now,
          publishedAt: form.status === 'published' ? now : '',
        },
        ...previous,
      ])
      setPage(1)
      showToast(form.status === 'published' ? '内容已新增并发布' : '内容草稿已保存')
    }

    setFormOpen(false)
  }

  const togglePublishStatus = (record: PolicyContent) => {
    const nextStatus: PolicyContentStatus = record.status === 'published' ? 'disabled' : 'published'
    const now = new Date().toISOString()
    setRecords((previous) =>
      previous.map((item) =>
        item.id === record.id
          ? {
              ...item,
              status: nextStatus,
              updatedBy: '当前用户',
              updatedAt: now,
              publishedAt: nextStatus === 'published' ? item.publishedAt || now : item.publishedAt,
            }
          : item,
      ),
    )
    showToast(nextStatus === 'published' ? '内容已发布' : '内容已下架')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setRecords((previous) => previous.filter((item) => item.id !== deleteTarget.id))
    setDeleteTarget(null)
    showToast('内容已删除')
  }

  const columns = [
    {
      key: 'title',
      title: '标题',
      width: '280px',
      render: (record: PolicyContent) => (
        <div className="max-w-[260px]">
          <div className="truncate font-medium text-gray-900">{record.title}</div>
          <div className="mt-1 truncate text-xs text-gray-400">{record.summary || '未填写摘要'}</div>
        </div>
      ),
    },
    {
      key: 'category',
      title: '分类',
      width: '120px',
      render: (record: PolicyContent) => <CategoryTag category={record.category} />,
    },
    {
      key: 'content',
      title: '正文摘要',
      width: '300px',
      render: (record: PolicyContent) => (
        <div className="max-w-[280px] truncate text-gray-600">{getPlainText(record.content)}</div>
      ),
    },
    { key: 'sort', title: '排序', width: '80px', dataIndex: 'sort' as keyof PolicyContent },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (record: PolicyContent) => <StatusBadge status={record.status} />,
    },
    { key: 'updatedBy', title: '修改人', width: '100px', dataIndex: 'updatedBy' as keyof PolicyContent },
    {
      key: 'updatedAt',
      title: '修改时间',
      width: '150px',
      render: (record: PolicyContent) => formatDateTime(record.updatedAt),
    },
    {
      key: 'actions',
      title: '操作',
      width: '240px',
      render: (record: PolicyContent) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPreview(record)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
          >
            <Eye className="h-3.5 w-3.5" />
            预览
          </button>
          <button
            type="button"
            onClick={() => openEdit(record)}
            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => togglePublishStatus(record)}
            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
          >
            {record.status === 'published' ? '下架' : '发布'}
          </button>
          <button
            type="button"
            disabled={record.status === 'published'}
            title={record.status === 'published' ? '已发布内容须先下架后删除' : '删除内容'}
            onClick={() => setDeleteTarget(record)}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            删除
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="规则/政策展示"
        description="维护面向 B 端展示的预订规则、退改规则、新航线和新产品介绍内容"
      />

      <SearchPanel onSearch={submitSearch} onReset={resetSearch}>
        <label className="w-64 text-sm text-gray-600">
          <span className="mb-1.5 block">关键词</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && submitSearch()}
            placeholder="标题 / 摘要 / 正文"
            className="h-12 w-full rounded-md border border-gray-300 px-3 outline-none focus:border-blue-500"
          />
        </label>
        <label className="w-44 text-sm text-gray-600">
          <span className="mb-1.5 block">内容分类</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as 'all' | PolicyContentCategory)}
            className="h-12 w-full rounded-md border border-gray-300 bg-white px-3 outline-none focus:border-blue-500"
          >
            <option value="all">全部</option>
            {categoryOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="w-36 text-sm text-gray-600">
          <span className="mb-1.5 block">状态</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'all' | PolicyContentStatus)}
            className="h-12 w-full rounded-md border border-gray-300 bg-white px-3 outline-none focus:border-blue-500"
          >
            <option value="all">全部</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="disabled">已停用</option>
          </select>
        </label>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新增内容
        </button>
      </div>

      <DataTable<PolicyContent>
        rowKey="id"
        columns={columns}
        dataSource={pagedRecords}
        pagination={{
          current: page,
          pageSize,
          total: filteredRecords.length,
          onChange: setPage,
        }}
      />

      <FormDialog
        open={formOpen}
        title={editingId ? '编辑规则/政策内容' : '新增规则/政策内容'}
        width="max-w-5xl"
        onCancel={() => setFormOpen(false)}
        onSubmit={submitForm}
        submitText={form.status === 'published' ? '保存并发布' : '保存'}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-700">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                maxLength={60}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="请输入展示标题"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-red-500">{errors.title}</span>
                <span className="text-gray-400">{form.title.length}/60</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">
                内容分类 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value as PolicyContentCategory })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {categoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">摘要</label>
            <textarea
              value={form.summary}
              maxLength={120}
              rows={2}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
              placeholder="用于列表快速识别，可不填写"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-red-500">{errors.summary}</span>
              <span className="text-gray-400">{form.summary.length}/120</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">
              正文内容 <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              placeholder="请输入规则、政策或产品介绍正文"
              minHeight="260px"
            />
            {errors.content && <div className="mt-1 text-xs text-red-500">{errors.content}</div>}
            <div className="mt-1 text-xs text-gray-400">
              支持加粗、斜体、下划线、有序列表和无序列表。
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-700">状态</label>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as PolicyContentStatus })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="disabled">已停用</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">排序</label>
              <input
                type="number"
                min={0}
                max={999}
                value={form.sort}
                onChange={(event) => setForm({ ...form, sort: Number(event.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="mt-1 text-xs text-red-500">{errors.sort}</div>
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer
        open={Boolean(preview)}
        title="规则/政策内容预览"
        width="w-[760px]"
        onClose={() => setPreview(null)}
      >
        {preview && (
          <div>
            <DetailCard title="发布信息">
              <DetailRow label="分类" value={<CategoryTag category={preview.category} />} />
              <DetailRow label="状态" value={<StatusBadge status={preview.status} />} />
              <DetailRow label="排序" value={preview.sort} />
              <DetailRow label="修改人" value={preview.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(preview.updatedAt)} />
              <DetailRow
                label="首次发布时间"
                value={preview.publishedAt ? formatDateTime(preview.publishedAt) : '尚未发布'}
              />
            </DetailCard>
            <div className="px-1 py-2">
              <h2 className="text-xl font-semibold text-gray-900">{preview.title}</h2>
              {preview.summary && <p className="mt-2 text-sm text-gray-500">{preview.summary}</p>}
              <div className="my-5 h-px bg-gray-200" />
              <RichTextContent html={preview.content} />
            </div>
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除规则/政策内容"
        message={`确定删除“${deleteTarget?.title || ''}”吗？删除后不可恢复。`}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {toast && (
        <div className="fixed left-1/2 top-6 z-[70] -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
