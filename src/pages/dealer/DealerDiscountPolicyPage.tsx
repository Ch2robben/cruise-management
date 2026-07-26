import { useMemo, useState } from 'react'
import { Eye, LockKeyhole } from 'lucide-react'
import DataTable from '@/components/common/DataTable'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import {
  currentDealerProfile,
  getCurrentDealerDiscountPolicies,
  type DealerDiscountPolicy,
  type DealerDiscountPolicyStatus,
  type DealerDiscountPolicyType,
} from '@/mock/dealerDiscountPolicies'
import { formatCurrency } from '@/utils/format'

const policies = getCurrentDealerDiscountPolicies()

const statusClass: Record<DealerDiscountPolicyStatus, string> = {
  生效中: 'bg-green-50 text-green-700',
  待生效: 'bg-blue-50 text-blue-700',
  已失效: 'bg-gray-100 text-gray-500',
}

const typeClass: Record<DealerDiscountPolicyType, string> = {
  专属结算价: 'bg-blue-50 text-blue-700',
  团队优惠: 'bg-purple-50 text-purple-700',
  限时促销: 'bg-orange-50 text-orange-700',
  口岸优惠: 'bg-teal-50 text-teal-700',
}

function StatusTag({ status }: { status: DealerDiscountPolicyStatus }) {
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusClass[status]}`}>{status}</span>
}

function PolicyTypeTag({ type }: { type: DealerDiscountPolicyType }) {
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${typeClass[type]}`}>{type}</span>
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="border border-gray-200 bg-white px-5 py-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
      <div className="mt-1 text-xs text-gray-400">{note}</div>
    </div>
  )
}

export default function DealerDiscountPolicyPage() {
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [policyType, setPolicyType] = useState('')
  const [productName, setProductName] = useState('')
  const [query, setQuery] = useState({ keyword: '', status: '', policyType: '', productName: '' })
  const [detail, setDetail] = useState<DealerDiscountPolicy | null>(null)

  const productOptions = useMemo(
    () => Array.from(new Set(policies.map((policy) => policy.productName))),
    [],
  )

  const filteredPolicies = useMemo(() => {
    const normalizedKeyword = query.keyword.trim().toLowerCase()
    return policies.filter((policy) => {
      const matchesKeyword = !normalizedKeyword || [policy.name, policy.code, policy.productName, policy.voyageScope]
        .some((value) => value.toLowerCase().includes(normalizedKeyword))
      const matchesStatus = !query.status || policy.status === query.status
      const matchesType = !query.policyType || policy.policyType === query.policyType
      const matchesProduct = !query.productName || policy.productName === query.productName
      return matchesKeyword && matchesStatus && matchesType && matchesProduct
    })
  }, [query])

  const submitSearch = () => setQuery({ keyword, status, policyType, productName })
  const resetSearch = () => {
    setKeyword('')
    setStatus('')
    setPolicyType('')
    setProductName('')
    setQuery({ keyword: '', status: '', policyType: '', productName: '' })
  }

  const activePolicies = policies.filter((policy) => policy.status === '生效中')
  const availableQuota = activePolicies.reduce((sum, policy) => sum + (policy.quotaTotal ? policy.quotaTotal - policy.quotaUsed : 0), 0)

  return (
    <div>
      <PageHeader title="优惠政策" />

      <div className="mb-5 flex items-start gap-3 border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-medium">数据范围：当前登录经销商</div>
          <div className="mt-1 text-blue-700">
            当前账号：{currentDealerProfile.name}（{currentDealerProfile.groupName}）。页面仅展示分配给本账号的政策，不支持切换或查询其他经销商。
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metric label="全部政策" value={policies.length} note="含待生效及历史政策" />
        <Metric label="生效中" value={activePolicies.length} note="下单时可自动匹配" />
        <Metric label="待生效" value={policies.filter((policy) => policy.status === '待生效').length} note="请留意政策生效时间" />
        <Metric label="剩余可用配额" value={availableQuota} note="仅统计生效中的限额政策" />
      </div>

      <SearchPanel onSearch={submitSearch} onReset={resetSearch}>
        <label className="w-64 text-sm text-gray-600">
          <span className="mb-1.5 block">关键词</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && submitSearch()}
            placeholder="政策名称 / 编码 / 产品"
            className="h-12 w-full rounded-md border border-gray-300 px-3 outline-none focus:border-blue-500"
          />
        </label>
        <label className="w-44 text-sm text-gray-600">
          <span className="mb-1.5 block">政策状态</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 w-full rounded-md border border-gray-300 bg-white px-3 outline-none focus:border-blue-500">
            <option value="">全部</option>
            <option value="生效中">生效中</option>
            <option value="待生效">待生效</option>
            <option value="已失效">已失效</option>
          </select>
        </label>
        <label className="w-48 text-sm text-gray-600">
          <span className="mb-1.5 block">政策类型</span>
          <select value={policyType} onChange={(event) => setPolicyType(event.target.value)} className="h-12 w-full rounded-md border border-gray-300 bg-white px-3 outline-none focus:border-blue-500">
            <option value="">全部</option>
            {Object.keys(typeClass).map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="w-56 text-sm text-gray-600">
          <span className="mb-1.5 block">适用产品</span>
          <select value={productName} onChange={(event) => setProductName(event.target.value)} className="h-12 w-full rounded-md border border-gray-300 bg-white px-3 outline-none focus:border-blue-500">
            <option value="">全部</option>
            {productOptions.map((product) => <option key={product} value={product}>{product}</option>)}
          </select>
        </label>
      </SearchPanel>

      <DataTable<DealerDiscountPolicy>
        rowKey="id"
        dataSource={filteredPolicies}
        emptyText="暂无符合条件的本账号优惠政策"
        columns={[
          {
            key: 'policy',
            title: '政策名称',
            width: '230px',
            render: (policy) => (
              <div>
                <div className="font-medium text-gray-900">{policy.name}</div>
                <div className="mt-1 font-mono text-xs text-gray-400">{policy.code}</div>
              </div>
            ),
          },
          { key: 'type', title: '政策类型', width: '130px', render: (policy) => <PolicyTypeTag type={policy.policyType} /> },
          {
            key: 'scope',
            title: '适用产品 / 航次',
            width: '240px',
            render: (policy) => <div><div className="text-gray-900">{policy.productName}</div><div className="mt-1 text-xs text-gray-400">{policy.voyageScope}</div></div>,
          },
          {
            key: 'discount',
            title: '优惠方式',
            width: '180px',
            render: (policy) => <div><div className="font-medium text-blue-700">{policy.discountLabel}</div><div className="mt-1 text-xs text-gray-400">零售 {formatCurrency(policy.retailPrice)} / 结算 {formatCurrency(policy.settlementPrice)}</div></div>,
          },
          { key: 'minimum', title: '起订条件', width: '100px', render: (policy) => policy.minPeople > 1 ? `≥ ${policy.minPeople} 人` : '无门槛' },
          {
            key: 'quota',
            title: '使用配额',
            width: '150px',
            render: (policy) => policy.quotaTotal === null ? '不限额' : (
              <div className="w-28">
                <div className="mb-1 flex justify-between text-xs"><span>{policy.quotaUsed}/{policy.quotaTotal}</span><span>{Math.round(policy.quotaUsed / policy.quotaTotal * 100)}%</span></div>
                <div className="h-1.5 overflow-hidden bg-gray-100"><div className="h-full bg-blue-500" style={{ width: `${Math.min(100, policy.quotaUsed / policy.quotaTotal * 100)}%` }} /></div>
              </div>
            ),
          },
          { key: 'period', title: '有效期', width: '190px', render: (policy) => <span className="text-xs">{policy.startDate} 至 {policy.endDate}</span> },
          { key: 'status', title: '状态', width: '90px', render: (policy) => <StatusTag status={policy.status} /> },
          {
            key: 'actions',
            title: '操作',
            width: '80px',
            render: (policy) => (
              <button type="button" onClick={() => setDetail(policy)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
                <Eye className="h-4 w-4" />查看
              </button>
            ),
          },
        ]}
      />

      <DetailDrawer open={Boolean(detail)} title="优惠政策详情" width="w-[720px]" onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <div className="mb-5 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              本政策已分配给当前账号，页面仅供查看，实际计价结果以下单时的政策匹配和快照为准。
            </div>
            <DetailCard title="政策信息">
              <DetailRow label="政策名称" value={detail.name} />
              <DetailRow label="政策编码" value={detail.code} mono />
              <DetailRow label="政策类型" value={<PolicyTypeTag type={detail.policyType} />} />
              <DetailRow label="状态" value={<StatusTag status={detail.status} />} />
              <DetailRow label="优先级" value={detail.priority} />
              <DetailRow label="政策说明" value={detail.description} />
            </DetailCard>
            <DetailCard title="适用范围">
              <DetailRow label="归属账号" value={currentDealerProfile.name} />
              <DetailRow label="所属分组" value={currentDealerProfile.groupName} />
              <DetailRow label="适用产品" value={detail.productName} />
              <DetailRow label="航次范围" value={detail.voyageScope} />
              <DetailRow label="票类" value={detail.ticketType} />
              <DetailRow label="房型" value={detail.roomTypes.join('、')} />
              <DetailRow label="起订条件" value={detail.minPeople > 1 ? `至少 ${detail.minPeople} 人` : '无最低起订人数'} />
              <DetailRow label="有效期" value={`${detail.startDate} 至 ${detail.endDate}`} />
            </DetailCard>
            <DetailCard title="优惠与配额">
              <DetailRow label="优惠方式" value={<span className="font-medium text-blue-700">{detail.discountLabel}</span>} />
              <DetailRow label="建议零售价" value={formatCurrency(detail.retailPrice)} />
              <DetailRow label="经销商结算价" value={formatCurrency(detail.settlementPrice)} />
              <DetailRow label="已用 / 总配额" value={detail.quotaTotal === null ? '不限额' : `${detail.quotaUsed} / ${detail.quotaTotal}`} />
            </DetailCard>
            <DetailCard title="使用规则">
              <ol className="space-y-2 text-sm text-gray-700">
                {detail.usageRules.map((rule, index) => <li key={rule}>{index + 1}. {rule}</li>)}
              </ol>
            </DetailCard>
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}
