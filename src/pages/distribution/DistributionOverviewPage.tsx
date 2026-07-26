import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import DataTable from '@/components/common/DataTable'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import { distributionGroups, type DistributionGroupSummary } from '@/mock/distributionPricing'

function CopyConfigurationDialog({ target, onClose, onConfirm }: {
  target: DistributionGroupSummary
  onClose: () => void
  onConfirm: (sourceGroupId: string) => void
}) {
  const availableGroups = distributionGroups.filter(group => group.id !== target.id)
  const [sourceGroupId, setSourceGroupId] = useState(availableGroups[0]?.id ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">同其他分组配置</h3>
          <button type="button" aria-label="关闭" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">
          <p className="mb-4 text-sm leading-6 text-gray-600">将其他分组的产品授权及分销价格复制到“{target.name}”。确认后会覆盖该分组现有配置。</p>
          <label className="mb-2 block text-sm text-gray-700">来源分组<span className="ml-0.5 text-red-500">*</span></label>
          <select value={sourceGroupId} onChange={event => setSourceGroupId(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {availableGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button type="button" disabled={!sourceGroupId} onClick={() => onConfirm(sourceGroupId)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">确认复制</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DistributionOverviewPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [copyTarget, setCopyTarget] = useState<DistributionGroupSummary | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  const filteredGroups = useMemo(() => (
    distributionGroups.filter(group => group.name.includes(appliedKeyword.trim()))
  ), [appliedKeyword])

  const columns = [
    { key: 'name', title: '分销商分组', dataIndex: 'name' as const, width: '28%' },
    { key: 'lastOperatedAt', title: '最近操作时间', dataIndex: 'lastOperatedAt' as const, width: '36%' },
    {
      key: 'actions',
      title: '操作',
      render: (group: DistributionGroupSummary) => (
        <div className="flex items-center gap-4 text-sm">
          <button type="button" onClick={() => navigate(`/distribution-management/${group.id}/prices`)} className="text-blue-600 hover:text-blue-700">分销价格</button>
          <button type="button" onClick={() => setCopyTarget(group)} className="text-blue-600 hover:text-blue-700">同其他分组配置</button>
          <button type="button" onClick={() => showToast(`已进入“${group.name}”日历结算价配置`)} className="text-blue-600 hover:text-blue-700">日历结算价</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      {toast && <div className="fixed left-1/2 top-6 z-[999] -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <PageHeader title="分销管理" />
      <SearchPanel
        onSearch={() => { setAppliedKeyword(keyword); setPage(1) }}
        onReset={() => { setKeyword(''); setAppliedKeyword(''); setPage(1) }}
      >
        <label className="flex items-center gap-3">
          <span className="text-base text-gray-700">分组</span>
          <input value={keyword} onChange={event => setKeyword(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { setAppliedKeyword(keyword); setPage(1) } }} placeholder="请输入分组名称" className="h-12 w-72 rounded-md border border-gray-300 px-4 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </label>
      </SearchPanel>
      <div className="mt-6">
        <DataTable
          columns={columns}
          dataSource={filteredGroups}
          rowKey="id"
          emptyText="未查询到匹配的分销商分组"
          pagination={{ current: page, pageSize: 10, total: filteredGroups.length, onChange: setPage }}
        />
      </div>
      {copyTarget && (
        <CopyConfigurationDialog
          target={copyTarget}
          onClose={() => setCopyTarget(null)}
          onConfirm={sourceGroupId => {
            const source = distributionGroups.find(group => group.id === sourceGroupId)
            setCopyTarget(null)
            showToast(`已将“${source?.name ?? '-'}”的配置复制到“${copyTarget.name}”`)
          }}
        />
      )}
    </div>
  )
}
