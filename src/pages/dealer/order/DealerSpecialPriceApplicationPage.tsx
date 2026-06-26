import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, RotateCcw, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { formatCurrency, formatDateTime } from '@/utils/format'
import {
  specialPriceApplications,
  type SpecialPriceApplicationRecord,
  type SpecialPriceApplicationStatus,
} from '@/mock/specialPriceApplications'

const statusColor: Record<SpecialPriceApplicationStatus, string> = {
  待审批: 'bg-amber-100 text-amber-700',
  已通过: 'bg-green-100 text-green-700',
  已驳回: 'bg-red-100 text-red-700',
}

function StatusPill({ status }: { status: SpecialPriceApplicationStatus }) {
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusColor[status]}`}>{status}</span>
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? 'text-blue-600' : 'text-gray-900'}`}>{value}</div>
    </div>
  )
}

function FieldItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-h-8 grid-cols-[108px_1fr] items-start gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="break-words text-gray-900">{value || '-'}</span>
    </div>
  )
}

export default function DealerSpecialPriceApplicationPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    keyword: '',
    status: '全部',
    dealerName: '',
    voyageNo: '',
  })
  const [detail, setDetail] = useState<SpecialPriceApplicationRecord | null>(null)

  const filteredList = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    return specialPriceApplications.filter((item) => {
      const matchKeyword =
        !keyword ||
        item.applicationNo.toLowerCase().includes(keyword) ||
        item.groupName.toLowerCase().includes(keyword) ||
        item.relatedOrderNo?.toLowerCase().includes(keyword)
      const matchStatus = filters.status === '全部' || item.status === filters.status
      const matchDealer = !filters.dealerName || item.dealerName.includes(filters.dealerName)
      const matchVoyage = !filters.voyageNo || item.voyageNo.includes(filters.voyageNo)
      return matchKeyword && matchStatus && matchDealer && matchVoyage
    })
  }, [filters])

  const totalRequested = useMemo(
    () => filteredList.reduce((sum, item) => sum + item.requestedAmount, 0),
    [filteredList],
  )
  const totalDiscount = useMemo(
    () => filteredList.reduce((sum, item) => sum + item.discountAmount, 0),
    [filteredList],
  )

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      keyword: '',
      status: '全部',
      dealerName: '',
      voyageNo: '',
    })
  }

  if (detail) {
    return (
      <div className="space-y-5">
        <PageHeader title="特价申请详情">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dealer/booking/special-price')}
              className="inline-flex h-11 items-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              新建申请
            </button>
            <button
              onClick={() => setDetail(null)}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              返回列表
            </button>
          </div>
        </PageHeader>

        <div className="space-y-5 border border-gray-200 bg-white px-9 py-6">
          <div className="text-sm text-blue-600">订单管理 / 特价申请单 / 详情</div>

          <section className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-800">申请概览</h3>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-5">
              <MetricCard label="申请状态" value={detail.status} />
              <MetricCard label="当前规则价" value={formatCurrency(detail.currentAmount)} />
              <MetricCard label="申请特价" value={formatCurrency(detail.requestedAmount)} accent />
              <MetricCard label="优惠差额" value={formatCurrency(detail.discountAmount)} />
              <MetricCard label="申请人数" value={`${detail.passengerCount} 人`} />
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-800">基础信息</h3>
              </div>
              <div className="grid gap-x-8 gap-y-3 p-5 lg:grid-cols-2">
                <FieldItem label="申请单号" value={detail.applicationNo} />
                <FieldItem label="关联订单" value={detail.relatedOrderNo || '-'} />
                <FieldItem label="团队名称" value={detail.groupName} />
                <FieldItem label="经销商" value={detail.dealerName} />
                <FieldItem label="申请范围" value={detail.applyScope} />
                <FieldItem label="创建时间" value={formatDateTime(detail.createdAt)} />
                <FieldItem label="提交时间" value={formatDateTime(detail.submittedAt)} />
                <FieldItem label="审批时间" value={detail.reviewedAt ? formatDateTime(detail.reviewedAt) : '-'} />
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-800">航次与联系人</h3>
              </div>
              <div className="grid gap-x-8 gap-y-3 p-5 lg:grid-cols-2">
                <FieldItem label="航次号" value={detail.voyageNo} />
                <FieldItem label="航线" value={detail.route} />
                <FieldItem label="游轮" value={detail.shipName} />
                <FieldItem label="开航日期" value={detail.sailDate} />
                <FieldItem label="联系人" value={detail.contactName} />
                <FieldItem label="联系电话" value={detail.contactPhone} />
                <FieldItem label="房间数" value={`${detail.roomCount} 间`} />
                <FieldItem label="游客数" value={`${detail.passengerCount} 人`} />
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-800">申请说明</h3>
            </div>
            <div className="space-y-4 p-5 text-sm">
              <div className="rounded-lg bg-gray-50 px-4 py-4">
                <div className="text-xs text-gray-500">申请原因</div>
                <div className="mt-1 whitespace-pre-wrap text-gray-900">{detail.reason}</div>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-4">
                <div className="text-xs text-gray-500">补充说明</div>
                <div className="mt-1 whitespace-pre-wrap text-gray-900">{detail.remark || '-'}</div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-800">审批结果</h3>
            </div>
            <div className="space-y-4 p-5 text-sm">
              <div className="flex items-center gap-3">
                <StatusPill status={detail.status} />
                <span className="text-gray-500">{detail.reviewer ? `审批人：${detail.reviewer}` : '当前仍在审批中'}</span>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-4">
                <div className="text-xs text-gray-500">审批意见</div>
                <div className="mt-1 whitespace-pre-wrap text-gray-900">
                  {detail.reviewComment || '暂无审批意见，等待审核处理。'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="特价申请单">
        <button
          onClick={() => navigate('/dealer/booking/special-price')}
          className="inline-flex h-11 items-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          新建特价申请
        </button>
      </PageHeader>

      <div className="border-b border-gray-200 bg-white px-9 py-6">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">申请单号/团队名称/关联订单</span>
            <input
              value={filters.keyword}
              onChange={(event) => updateFilter('keyword', event.target.value)}
              placeholder="请输入"
              className="h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">申请状态</span>
            <select
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500"
            >
              {['全部', '待审批', '已通过', '已驳回'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">经销商</span>
            <input
              value={filters.dealerName}
              onChange={(event) => updateFilter('dealerName', event.target.value)}
              placeholder="请输入"
              className="h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">航次号</span>
            <input
              value={filters.voyageNo}
              onChange={(event) => updateFilter('voyageNo', event.target.value)}
              placeholder="请输入"
              className="h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="申请单数" value={`${filteredList.length} 单`} />
            <MetricCard label="待审批" value={`${filteredList.filter((item) => item.status === '待审批').length} 单`} />
            <MetricCard label="申请特价合计" value={formatCurrency(totalRequested)} accent />
            <MetricCard label="优惠差额合计" value={formatCurrency(totalDiscount)} />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={resetFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-6 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
            <button
              onClick={() => void 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Search className="h-4 w-4" />
              搜索
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1480px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['申请单号', '状态', '团队名称', '经销商', '航次号', '航线', '开航日期', '申请范围', '当前规则价', '申请特价', '优惠差额', '房间/人数', '联系人', '提交时间', '操作'].map((title) => (
                  <th key={title} className="border-b border-r border-gray-200 px-4 py-4 text-center text-sm font-semibold text-gray-900 last:border-r-0">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <tr key={item.id} className="transition hover:bg-gray-50">
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-center">
                    <button
                      onClick={() => setDetail(item)}
                      className="font-mono text-blue-700 underline underline-offset-2 hover:text-blue-900"
                    >
                      {item.applicationNo}
                    </button>
                  </td>
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-center">
                    <StatusPill status={item.status} />
                  </td>
                  <td className="border-b border-r border-gray-200 px-4 py-4">{item.groupName}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4">{item.dealerName}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-center">{item.voyageNo}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4">{item.route}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-center">{item.sailDate}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-center">{item.applyScope}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-right tabular-nums">{formatCurrency(item.currentAmount)}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-right tabular-nums text-blue-700">{formatCurrency(item.requestedAmount)}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-right tabular-nums text-green-700">{formatCurrency(item.discountAmount)}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-center">{item.roomCount} 间 / {item.passengerCount} 人</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-center">{item.contactName}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-4 text-center">{item.submittedAt}</td>
                  <td className="border-b border-gray-200 px-4 py-4 text-center">
                    <button
                      onClick={() => setDetail(item)}
                      className="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={15} className="px-4 py-10 text-center text-sm text-gray-400">
                    暂无符合条件的特价申请单
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
