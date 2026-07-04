import { useMemo, useState } from 'react'
import { Check, Mail, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import { formatCurrency } from '@/utils/format'

type TouristOrderStatus = '待确认' | '已预订' | '已出行' | '已取消'

interface TouristOrderRow {
  id: string
  orderNo: string
  travelerName: string
  travelerPhone: string
  idType: string
  idNo: string
  voyageName: string
  route: string
  sailDate: string
  roomType: string
  occupancyType: string
  dealer: string
  contactName: string
  contactPhone: string
  status: TouristOrderStatus
  amount: number
  remark: string
}

const receiptImageUrl = '/order-receipt-sample.png'

const touristOrders: TouristOrderRow[] = [
  {
    id: 'TO-001',
    orderNo: 'DL202607030001',
    travelerName: 'Lucy Tang',
    travelerPhone: '13061639457',
    idType: '护照',
    idNo: '659377958',
    voyageName: '长江壹号 · 长江三峡 5 天 4 晚',
    route: '武汉 - 宜昌 - 巫山 - 重庆',
    sailDate: '2026-07-13',
    roomType: '行政房（双人房）',
    occupancyType: '标准入住',
    dealer: '美洲同业渠道',
    contactName: 'LUCY L TANG',
    contactPhone: '13061639457',
    status: '已预订',
    amount: 14600,
    remark: '需要一间安静的舱房，最好是双床房',
  },
  {
    id: 'TO-002',
    orderNo: 'DL202607030001',
    travelerName: 'Steven Wang',
    travelerPhone: '18559026242',
    idType: '护照',
    idNo: '648507889',
    voyageName: '长江壹号 · 长江三峡 5 天 4 晚',
    route: '武汉 - 宜昌 - 巫山 - 重庆',
    sailDate: '2026-07-13',
    roomType: '行政房（双人房）',
    occupancyType: '标准入住',
    dealer: '美洲同业渠道',
    contactName: 'LUCY L TANG',
    contactPhone: '13061639457',
    status: '已预订',
    amount: 14600,
    remark: '与 Lucy Tang 同住',
  },
  {
    id: 'TO-003',
    orderNo: 'DL202607010015',
    travelerName: '张明',
    travelerPhone: '13812345678',
    idType: '身份证',
    idNo: '420106198801011234',
    voyageName: '长江探索号 · 三峡精华 7 日游',
    route: '重庆 - 巫山 - 宜昌',
    sailDate: '2026-07-20',
    roomType: '阳台标准间',
    occupancyType: '标准入住',
    dealer: '华东旅行社',
    contactName: '李红',
    contactPhone: '13912345679',
    status: '待确认',
    amount: 6980,
    remark: '团体游客，靠窗优先',
  },
  {
    id: 'TO-004',
    orderNo: 'DL202606280007',
    travelerName: '王强',
    travelerPhone: '13712345670',
    idType: '护照',
    idNo: 'P12345678',
    voyageName: '长江叁号 · 武汉往返 5 日游',
    route: '武汉 - 九江 - 武汉',
    sailDate: '2026-08-10',
    roomType: '豪华套房',
    occupancyType: '加床',
    dealer: '海外渠道一部',
    contactName: '周敏',
    contactPhone: '13312345674',
    status: '已出行',
    amount: 12880,
    remark: '已安排接送站',
  },
]

const statusClass: Record<TouristOrderStatus, string> = {
  待确认: 'bg-orange-50 text-orange-700',
  已预订: 'bg-emerald-50 text-emerald-700',
  已出行: 'bg-blue-50 text-blue-700',
  已取消: 'bg-red-50 text-red-700',
}

const inputClass =
  'h-10 rounded border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

export default function DealerTouristOrderListPage() {
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [sailDate, setSailDate] = useState('')
  const [applied, setApplied] = useState({ keyword: '', status: '', sailDate: '' })
  const [detail, setDetail] = useState<TouristOrderRow | null>(null)
  const [receiptTarget, setReceiptTarget] = useState<TouristOrderRow | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  const filtered = useMemo(() => {
    const k = applied.keyword.trim().toLowerCase()
    return touristOrders.filter((item) => {
      const matchKeyword =
        !k ||
        item.orderNo.toLowerCase().includes(k) ||
        item.travelerName.toLowerCase().includes(k) ||
        item.contactName.toLowerCase().includes(k)
      const matchStatus = !applied.status || item.status === applied.status
      const matchDate = !applied.sailDate || item.sailDate === applied.sailDate
      return matchKeyword && matchStatus && matchDate
    })
  }, [applied])

  const columns = [
    {
      key: 'travelerName',
      title: '游客信息',
      render: (record: TouristOrderRow) => (
        <div>
          <div className="font-medium text-gray-900">{record.travelerName}</div>
          <div className="mt-1 text-xs text-gray-400">
            {record.idType} · {record.idNo}
          </div>
        </div>
      ),
    },
    {
      key: 'orderNo',
      title: '订单号',
      width: '160px',
      render: (record: TouristOrderRow) => <span className="font-mono text-gray-700">{record.orderNo}</span>,
    },
    {
      key: 'voyageName',
      title: '游轮产品',
      render: (record: TouristOrderRow) => (
        <div>
          <div className="font-medium text-gray-900">{record.voyageName}</div>
          <div className="mt-1 text-xs text-gray-400">{record.route}</div>
        </div>
      ),
    },
    {
      key: 'roomType',
      title: '房型/入住',
      width: '170px',
      render: (record: TouristOrderRow) => (
        <div>
          <div>{record.roomType}</div>
          <div className="mt-1 text-xs text-gray-400">{record.occupancyType}</div>
        </div>
      ),
    },
    {
      key: 'status',
      title: '订单状态',
      width: '90px',
      render: (record: TouristOrderRow) => <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass[record.status]}`}>{record.status}</span>,
    },
    {
      key: 'amount',
      title: '订单金额',
      width: '120px',
      render: (record: TouristOrderRow) => <span className="font-semibold text-orange-600">{formatCurrency(record.amount)}</span>,
    },
    {
      key: 'actions',
      title: '操作',
      width: '180px',
      render: (record: TouristOrderRow) => (
        <div className="flex items-center gap-3">
          <button className="text-blue-600 hover:text-blue-700" onClick={() => setDetail(record)}>
            订单详情
          </button>
          <button className="text-blue-600 hover:text-blue-700" onClick={() => setReceiptTarget(record)}>
            发送回执
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      {toast && (
        <div className="fixed left-1/2 top-6 z-[90] flex -translate-x-1/2 items-center gap-2 rounded bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
          <Check className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <PageHeader title="游客订单" description="按游客维度查看所属订单、出行与联系人信息。">
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">支持查看订单详情、发送回执</div>
      </PageHeader>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <SearchPanel
          onSearch={() => setApplied({ keyword, status, sailDate })}
          onReset={() => {
            setKeyword('')
            setStatus('')
            setSailDate('')
            setApplied({ keyword: '', status: '', sailDate: '' })
          }}
        >
          <label className="space-y-2">
            <span className="block text-sm text-gray-600">订单号/游客/联系人</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="请输入关键词" className={`${inputClass} w-72 pl-9`} />
            </div>
          </label>
          <label className="space-y-2">
            <span className="block text-sm text-gray-600">开航日期</span>
            <input value={sailDate} onChange={(e) => setSailDate(e.target.value)} type="date" className={`${inputClass} w-44`} />
          </label>
          <label className="space-y-2">
            <span className="block text-sm text-gray-600">订单状态</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} w-36`}>
              <option value="">全部状态</option>
              <option>待确认</option>
              <option>已预订</option>
              <option>已出行</option>
              <option>已取消</option>
            </select>
          </label>
        </SearchPanel>

        <div className="flex items-center justify-between px-9 py-5">
          <span className="text-sm text-gray-500">共 {filtered.length} 条游客订单</span>
          <span className="text-xs text-gray-400">一个订单下可拆分为多条游客记录，便于按人检索与发送回执</span>
        </div>

        <DataTable columns={columns} dataSource={filtered} rowKey="id" />
      </div>

      <DetailDrawer open={!!detail} title="游客订单详情" width="w-[860px]" onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-4">
            <DetailCard title="订单概览">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailRow label="订单号" value={detail.orderNo} mono />
                <DetailRow label="订单状态" value={<span className={`rounded px-2 py-1 text-xs font-medium ${statusClass[detail.status]}`}>{detail.status}</span>} />
                <DetailRow label="游轮产品" value={detail.voyageName} />
                <DetailRow label="开航日期" value={detail.sailDate} />
                <DetailRow label="航线" value={detail.route} />
                <DetailRow label="订单金额" value={formatCurrency(detail.amount)} />
              </div>
            </DetailCard>

            <DetailCard title="游客信息">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailRow label="游客姓名" value={detail.travelerName} />
                <DetailRow label="手机号" value={detail.travelerPhone} />
                <DetailRow label="证件类型" value={detail.idType} />
                <DetailRow label="证件号码" value={detail.idNo} mono />
                <DetailRow label="房型" value={detail.roomType} />
                <DetailRow label="入住类型" value={detail.occupancyType} />
              </div>
            </DetailCard>

            <DetailCard title="联系人与渠道">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailRow label="联系人" value={detail.contactName} />
                <DetailRow label="联系人手机" value={detail.contactPhone} />
                <DetailRow label="分销商" value={detail.dealer} />
                <DetailRow label="备注" value={detail.remark || '-'} />
              </div>
            </DetailCard>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setDetail(null)
                  setReceiptTarget(detail)
                }}
                className="inline-flex h-10 items-center gap-2 rounded bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"
              >
                <Mail className="h-4 w-4" />
                发送回执
              </button>
            </div>
          </div>
        )}
      </DetailDrawer>

      <DetailDrawer open={!!receiptTarget} title="发送回执" width="w-[980px]" onClose={() => setReceiptTarget(null)}>
        {receiptTarget && (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              当前将向游客 <span className="font-semibold">{receiptTarget.travelerName}</span> 发送订单回执，回执内容按你提供的样式图展示。
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <img src={receiptImageUrl} alt="订单回执示意图" className="w-full" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setReceiptTarget(null)} className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                取消
              </button>
              <button
                onClick={() => {
                  showToast(`已向 ${receiptTarget.travelerName} 发送回执`)
                  setReceiptTarget(null)
                }}
                className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                <Mail className="h-4 w-4" />
                确认发送
              </button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}
