import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { templateApi } from '@/mock/api'
import { products, ships, voyages } from '@/mock/data'
import TemplateLinkedVoyagesCell from '@/components/voyage/TemplateLinkedVoyagesCell'
import { groupVoyagesByTemplateId } from '@/utils/templateLinkedVoyages'
import { getTemplateCabinTypes, hasConfiguredTemplatePrice } from '@/mock/templatePriceRules'
import type { PaginatedResult, SearchParams, VoyageTemplate } from '@/types'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import TemplateLinkVoyageDialog from '@/components/voyage/TemplateLinkVoyageDialog'

const statusLabels: Record<string, string> = { draft: '草稿', enabled: '已启用', disabled: '已停用' }
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  enabled: 'bg-green-100 text-green-700',
  disabled: 'bg-red-100 text-red-600',
}
const directionLabels: Record<string, string> = { upstream: '上水', downstream: '下水' }

export default function VoyagePriceTemplatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('templateId')

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<VoyageTemplate>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [shipFilter, setShipFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [appliedFilters, setAppliedFilters] = useState({
    keyword: '',
    shipFilter: 'all',
    statusFilter: 'all',
  })
  const [autoOpenedTemplateId, setAutoOpenedTemplateId] = useState<string | null>(null)
  const [linkTemplateId, setLinkTemplateId] = useState<string | null>(null)

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true)
      const params: SearchParams = { page, pageSize: 10 }
      if (appliedFilters.keyword.trim()) params.keyword = appliedFilters.keyword.trim()
      if (appliedFilters.shipFilter !== 'all') params.shipName = appliedFilters.shipFilter
      if (appliedFilters.statusFilter !== 'all') params.status = appliedFilters.statusFilter
      const result = await templateApi.list(params)
      setData(result)
      setLoading(false)
    },
    [appliedFilters],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!templateId || autoOpenedTemplateId === templateId) return
    navigate(`/voyage/price-templates/${templateId}`)
    setAutoOpenedTemplateId(templateId)
  }, [autoOpenedTemplateId, navigate, templateId])

  const getTemplateDirection = (template: VoyageTemplate) =>
    directionLabels[products.find((item) => item.id === template.productId)?.routeType || ''] || '-'

  const linkedVoyagesByTemplate = useMemo(() => groupVoyagesByTemplateId(voyages), [data])

  const columns = [
    {
      key: 'index',
      title: '序号',
      width: '72px',
      render: (record: VoyageTemplate) => data.data.findIndex((item) => item.id === record.id) + 1,
    },
    {
      key: 'code',
      title: '模板编码',
      width: '160px',
      render: (record: VoyageTemplate) => <span className="font-mono text-xs">{record.code}</span>,
    },
    { key: 'name', title: '模板名称', dataIndex: 'name' as keyof VoyageTemplate },
    { key: 'productName', title: '关联产品', dataIndex: 'productName' as keyof VoyageTemplate, width: '180px' },
    { key: 'shipName', title: '适用游轮', dataIndex: 'shipName' as keyof VoyageTemplate, width: '120px' },
    {
      key: 'direction',
      title: '航行类型',
      width: '100px',
      render: (record: VoyageTemplate) => getTemplateDirection(record),
    },
    {
      key: 'basePriceRef',
      title: '基准价参考',
      width: '110px',
      render: (record: VoyageTemplate) => (record.basePriceRef ? `¥${record.basePriceRef}` : '-'),
    },
    {
      key: 'linkedVoyages',
      title: '生效航次',
      width: '200px',
      render: (record: VoyageTemplate) => (
        <TemplateLinkedVoyagesCell voyages={linkedVoyagesByTemplate.get(record.id) || []} />
      ),
    },
    {
      key: 'priceStatus',
      title: '价格配置',
      width: '100px',
      render: (record: VoyageTemplate) => {
        const cabinTypes = getTemplateCabinTypes(record)
        const configured = hasConfiguredTemplatePrice(record.id, cabinTypes)
        return (
          <span className={`text-sm ${configured ? 'text-emerald-600' : 'text-gray-400'}`}>
            {configured ? '已配置' : '默认'}
          </span>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (record: VoyageTemplate) => (
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusColors[record.status]}`}>
          {statusLabels[record.status]}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: '修改时间',
      width: '170px',
      render: (record: VoyageTemplate) => formatDateTime(record.updatedAt),
    },
    {
      key: 'actions',
      title: '操作',
      width: '200px',
      render: (record: VoyageTemplate) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/voyage/price-templates/${record.id}`)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            配置价格
          </button>
          <button
            onClick={() => setLinkTemplateId(record.id)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            关联航次
          </button>
        </div>
      ),
    },
  ]

  const shipOptions = useMemo(() => [...new Set(ships.map((item) => item.name))], [])

  return (
    <div>
      <PageHeader
        title="航次价格配置"
        description="按航次模板维护各房型、各航段的基础变量与入住组合价格公式。"
      />

      <SearchPanel
        onSearch={() => setAppliedFilters({ keyword, shipFilter, statusFilter })}
        onReset={() => {
          setKeyword('')
          setShipFilter('all')
          setStatusFilter('all')
          setAppliedFilters({ keyword: '', shipFilter: 'all', statusFilter: 'all' })
        }}
        loading={loading}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">所属游轮</label>
          <select
            value={shipFilter}
            onChange={(e) => setShipFilter(e.target.value)}
            className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">全部</option>
            {shipOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">全部</option>
            <option value="draft">草稿</option>
            <option value="enabled">已启用</option>
            <option value="disabled">已停用</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">模糊搜索</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="模板编码/名称"
            className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </SearchPanel>

      <DataTable
        columns={columns}
        dataSource={data.data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: data.page,
          pageSize: data.pageSize,
          total: data.total,
          onChange: fetchData,
        }}
      />

      <TemplateLinkVoyageDialog
        open={Boolean(linkTemplateId)}
        templateId={linkTemplateId}
        onClose={() => setLinkTemplateId(null)}
        onSaved={() => fetchData(data.page)}
      />
    </div>
  )
}
