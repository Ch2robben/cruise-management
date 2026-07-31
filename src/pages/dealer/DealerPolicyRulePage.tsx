import { useMemo, useState } from 'react'
import {
  FileText,
  Search,
  Eye,
  Pin,
  Calendar,
  Layers,
  Info,
  Copy,
  Printer,
  CheckCircle2,
  List,
  LayoutGrid,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import { RichTextContent } from '@/components/common/RichTextEditor'
import DataTable from '@/components/common/DataTable'
import {
  getPublishedPolicyContents,
  getCategoryLabel,
  getPlainText,
  categoryClass,
  type PolicyContent,
  type PolicyContentCategory,
} from '@/mock/policyContentStore'
import { formatDateTime } from '@/utils/format'

function CategoryTag({ category }: { category: PolicyContentCategory }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold border ${categoryClass[category]}`}>
      {getCategoryLabel(category)}
    </span>
  )
}

export default function DealerPolicyRulePage() {
  const allPublished = useMemo(() => getPublishedPolicyContents(), [])

  const [selectedCategory, setSelectedCategory] = useState<'all' | PolicyContentCategory>('all')
  const [keyword, setKeyword] = useState('')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

  const [activeDetail, setActiveDetail] = useState<PolicyContent | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }

  const filteredContents = useMemo(() => {
    const norm = keyword.trim().toLowerCase()
    return allPublished
      .filter((item) => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
        const matchesKeyword =
          !norm ||
          [item.title, item.summary, getPlainText(item.content)].some((text) =>
            text.toLowerCase().includes(norm),
          )
        return matchesCategory && matchesKeyword
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return a.sort - b.sort || b.publishedAt.localeCompare(a.publishedAt)
      })
  }, [allPublished, selectedCategory, keyword])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allPublished.length }
    allPublished.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1
    })
    return counts
  }, [allPublished])

  const handleCopyText = (content: PolicyContent) => {
    const text = `${content.title}\n\n${content.summary ? '摘要：' + content.summary + '\n' : ''}\n${getPlainText(content.content)}\n\n(来源：长航集团游轮管理分销平台)`
    navigator.clipboard.writeText(text)
    showToast('内容已复制到剪贴板，可直接发送给客户或粘贴使用')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-lg bg-gray-900/90 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-white shadow-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <PageHeader
        title="规则/政策展示"
        description="查看长航集团游轮管理平台官方发布的最新预订规程、退改损耗细则、新航线公告及分销优惠政策"
      />

      {/* Notice Banner */}
      <div className="flex items-start gap-4 rounded-xl border border-gray-200 border-l-4 border-l-blue-600 bg-white p-4 shadow-sm">
        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 shrink-0">
          <Info className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <span>经销商官方规程与执行须知</span>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">官方发布</span>
          </div>
          <div className="mt-1 text-xs text-gray-600 leading-relaxed">
            本页面展示内容由长航集团总部运营中心统一发布并实时维护。产品预订、客人退改损耗核算、航运不可抗力关团及返利结算均严格以此处公布的最新规则与政策为依据。
          </div>
        </div>
      </div>



      {/* Filter & View Mode Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Segmented Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-100/90 p-1.5 border border-gray-200/80">
            {[
              { id: 'all' as const, label: '全部', count: categoryCounts['all'] || 0 },
              { id: 'booking_rule' as const, label: '预订规则', count: categoryCounts['booking_rule'] || 0 },
              { id: 'change_refund_rule' as const, label: '退改规则', count: categoryCounts['change_refund_rule'] || 0 },
              { id: 'new_route' as const, label: '新航线发布', count: categoryCounts['new_route'] || 0 },
              { id: 'new_product' as const, label: '新产品介绍', count: categoryCounts['new_product'] || 0 },
              { id: 'distribution_policy' as const, label: '分销政策说明', count: categoryCounts['distribution_policy'] || 0 },
            ].map((tab) => {
              const isActive = selectedCategory === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm border border-gray-200/80 font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200/80 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search & Layout View Control */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索规则标题 / 正文关键字..."
                className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  清空
                </button>
              )}
            </div>

            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-100 p-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                title="卡片布局"
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'card' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="表格列表"
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredContents.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <div className="mt-3 text-base font-semibold text-gray-700">暂无符合条件的规则或政策内容</div>
          <div className="mt-1 text-xs text-gray-400">请尝试切换左侧分类标签或重新输入搜索关键词</div>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredContents.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveDetail(item)}
              className="group flex flex-col justify-between min-h-[270px] rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <CategoryTag category={item.category} />
                  {item.pinned && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      <Pin className="h-3 w-3 fill-amber-500 text-amber-600" /> 置顶规则
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>

                {item.summary && (
                  <p className="text-xs leading-relaxed text-gray-500 line-clamp-2">
                    {item.summary}
                  </p>
                )}

                <div className="rounded-lg bg-gray-50/90 p-3 border border-gray-100 text-xs text-gray-600 leading-relaxed overflow-hidden">
                  <span className="font-semibold text-gray-700">要点预览：</span>
                  <span className="line-clamp-2">{getPlainText(item.content)}</span>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {formatDateTime(item.publishedAt || item.updatedAt)}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform text-xs">
                  查看全篇 <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable<PolicyContent>
          rowKey="id"
          dataSource={filteredContents}
          columns={[
            {
              key: 'title',
              title: '规则/政策名称',
              width: '320px',
              render: (record) => (
                <div>
                  <div className="flex items-center gap-1.5">
                    {record.pinned && (
                      <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-600 shrink-0" />
                    )}
                    <span className="font-semibold text-gray-900 hover:text-blue-600 transition cursor-pointer" onClick={() => setActiveDetail(record)}>
                      {record.title}
                    </span>
                  </div>
                  {record.summary && <div className="mt-1 text-xs text-gray-400 truncate">{record.summary}</div>}
                </div>
              ),
            },
            {
              key: 'category',
              title: '分类',
              width: '140px',
              render: (record) => <CategoryTag category={record.category} />,
            },
            {
              key: 'summary',
              title: '要点内容摘要',
              width: '380px',
              render: (record) => <div className="truncate text-xs text-gray-600">{getPlainText(record.content)}</div>,
            },
            {
              key: 'publishedAt',
              title: '发布时间',
              width: '160px',
              render: (record) => (
                <span className="font-mono text-xs text-gray-500">
                  {formatDateTime(record.publishedAt || record.updatedAt)}
                </span>
              ),
            },
            {
              key: 'action',
              title: '操作',
              width: '100px',
              render: (record) => (
                <button
                  type="button"
                  onClick={() => setActiveDetail(record)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-3.5 w-3.5" /> 查看详情
                </button>
              ),
            },
          ]}
        />
      )}

      {/* Detail Drawer */}
      <DetailDrawer
        open={Boolean(activeDetail)}
        title="长航集团官方规则/政策详情"
        width="w-[780px]"
        onClose={() => setActiveDetail(null)}
      >
        {activeDetail && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <CategoryTag category={activeDetail.category} />
                <span className="font-medium text-gray-700">发布单位：长航集团总部运营中心</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(activeDetail)}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm"
                >
                  <Copy className="h-3.5 w-3.5 text-gray-500" />
                  一键复制正文
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5 text-gray-500" />
                  打印本文
                </button>
              </div>
            </div>

            <DetailCard title="元数据与发布属性">
              <DetailRow label="规则标题" value={<span className="font-bold text-gray-900">{activeDetail.title}</span>} />
              <DetailRow label="所属分类" value={<CategoryTag category={activeDetail.category} />} />
              <DetailRow label="发布时间" value={<span className="font-mono">{formatDateTime(activeDetail.publishedAt || activeDetail.updatedAt)}</span>} />
              <DetailRow label="维护责任人" value={activeDetail.updatedBy} />
              {activeDetail.summary && <DetailRow label="核心摘要" value={activeDetail.summary} />}
            </DetailCard>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 leading-snug">{activeDetail.title}</h2>
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-3">
                  <span>发布时间：{formatDateTime(activeDetail.publishedAt || activeDetail.updatedAt)}</span>
                  <span>修改人：{activeDetail.updatedBy}</span>
                </div>
              </div>

              <div className="mt-5 text-sm leading-relaxed text-gray-800">
                <RichTextContent html={activeDetail.content} />
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}
