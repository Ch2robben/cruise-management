import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import TaskClaimWizard from '@/components/dealer/claim/TaskClaimWizard'
import {
  cancelDealerTaskClaim,
  getClaimDealer,
  listDealerTaskClaims,
  type DealerTaskClaim,
} from '@/mock/dealerTaskClaims'
import { formatCurrency, formatDateTime } from '@/utils/format'

export default function DealerTaskClaimPage() {
  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [claims, setClaims] = useState(() => listDealerTaskClaims())
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detail, setDetail] = useState<DealerTaskClaim | null>(null)
  const [cancelId, setCancelId] = useState('')
  const [toast, setToast] = useState('')
  const dealer = getClaimDealer()

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const refresh = () => setClaims(listDealerTaskClaims())

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return claims.filter((item) => {
      const matchedKw = !kw || [
        item.claimNo,
        item.productName,
        item.ship,
        item.route,
        item.voyageDate,
        ...item.lines.map((line) => `${line.segmentLabel}${line.roomType}`),
      ].some((value) => value.toLowerCase().includes(kw))
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKw && matchedStatus
    })
  }, [claims, keyword, statusFilter])

  if (mode === 'create') {
    return (
      <div className="space-y-5">
        <PageHeader title="任务认领" description="选择航次后，按航段认领各房型下单间数并支付定金；支付成功同步生成一条锁舱记录。" />
        <TaskClaimWizard
          onCancel={() => setMode('list')}
          onPaid={(claimNo, holdHint) => {
            refresh()
            setMode('list')
            showToast(`认领成功 ${claimNo}，${holdHint}`)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed left-1/2 top-6 z-[999] -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
      <PageHeader title="任务认领" description={`当前账号：${dealer.name}。按航次认领房型间数，支付定金后锁定库存。`}>
        <button
          type="button"
          onClick={() => setMode('create')}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新建认领
        </button>
      </PageHeader>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">关键词</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="认领单号 / 产品 / 航段 / 房型"
            className="h-9 w-64 rounded-lg border border-gray-300 px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-gray-500">状态</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="all">全部</option>
            <option value="pending_payment">待支付定金</option>
            <option value="effective">有效</option>
            <option value="cancelled">已取消</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">认领单号</th>
              <th className="px-4 py-3 text-left font-medium">航次</th>
              <th className="px-4 py-3 text-left font-medium">产品</th>
              <th className="px-4 py-3 text-left font-medium">认领明细</th>
              <th className="px-4 py-3 text-right font-medium">间数</th>
              <th className="px-4 py-3 text-right font-medium">定金</th>
              <th className="px-4 py-3 text-left font-medium">锁舱单</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">暂无认领记录</td>
              </tr>
            ) : filtered.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-800">{item.claimNo}</td>
                <td className="px-4 py-3">
                  <div className="text-gray-900">{item.ship} · {item.voyageDate}</div>
                  <div className="text-xs text-gray-400">{item.route} · {item.days}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">{item.productName}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {item.lines.slice(0, 2).map((line) => (
                    <div key={`${line.segmentId}-${line.roomType}`}>
                      {line.segmentLabel} · {line.roomType} {line.rooms}间
                    </div>
                  ))}
                  {item.lines.length > 2 && <div className="text-gray-400">等{item.lines.length}项</div>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{item.totalRooms} 间</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(item.depositAmount)}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.holdId || '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <button type="button" onClick={() => setDetail(item)} className="text-blue-600 hover:underline">详情</button>
                    {item.status === 'pending_payment' && (
                      <button type="button" onClick={() => setCancelId(item.id)} className="text-red-500 hover:underline">取消</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailDrawer open={Boolean(detail)} title="认领单详情" width="max-w-xl" onClose={() => setDetail(null)}>
        {detail && (
          <>
            <DetailCard title="航次信息">
              <DetailRow label="认领单号" value={detail.claimNo} />
              <DetailRow label="产品" value={detail.productName} />
              <DetailRow label="船舶 / 航次" value={`${detail.ship} · ${detail.voyageDate}`} />
              <DetailRow label="航线" value={`${detail.route} · ${detail.days}`} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>
            <DetailCard title="认领明细（按间）">
              <div className="space-y-2">
                {detail.lines.map((line) => (
                  <div key={`${line.segmentId}-${line.roomType}`} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium text-gray-900">{line.segmentLabel} · {line.roomType}</div>
                      <div className="text-xs text-gray-400">定金 {formatCurrency(line.depositPerRoom)}/间</div>
                    </div>
                    <div className="tabular-nums text-gray-800">{line.rooms} 间</div>
                  </div>
                ))}
              </div>
            </DetailCard>
            <DetailCard title="定金与锁舱">
              <DetailRow label="认领总间数" value={`${detail.totalRooms} 间`} />
              <DetailRow label="定金金额" value={formatCurrency(detail.depositAmount)} />
              <DetailRow label="锁舱记录" value={detail.holdId || '支付后生成'} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
              <DetailRow label="支付时间" value={detail.paidAt ? formatDateTime(detail.paidAt) : '-'} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={Boolean(cancelId)}
        title="取消认领"
        message="取消后不会锁定库存，也不会生成锁舱记录。确定取消该认领单？"
        danger
        onCancel={() => setCancelId('')}
        onConfirm={() => {
          cancelDealerTaskClaim(cancelId)
          setCancelId('')
          refresh()
          showToast('认领单已取消')
        }}
      />
    </div>
  )
}
