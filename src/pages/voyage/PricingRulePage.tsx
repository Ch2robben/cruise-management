import { useMemo, useState } from 'react'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'

type PricingRuleRecord = {
  id: string
  shipName: string
  cabinName: string
  cabinCount: number
  guestCapacity: number
  bedCount: number
  sortNo: number
  updatedBy: string
  updatedAt: string
}

type CabinPricingRule = {
  effectiveStart: string
  effectiveEnd: string
  ruleMode: 'standard' | 'seasonal'
  singleSharedFactor: number
  standardTwoAdultFactor: number
  singleRoomFactor: number
  oneAdultOneChildBedFactor: number
  twoAdultOneBabyFactor: number
  thirdChildNoBedFactor: number
  thirdChildExtraBedFactor: number
  threeAdultExtraBedFactor: number
}

const pricingRuleData: PricingRuleRecord[] = [
  { id: '1', shipName: '长江叁号', cabinName: '长江叁号豪华阳台标准间', cabinCount: 500, guestCapacity: 3, bedCount: 2, sortNo: 1, updatedBy: '彭琳', updatedAt: '2024-11-07 14:35:11' },
  { id: '2', shipName: '长江叁号', cabinName: '标准间', cabinCount: 500, guestCapacity: 3, bedCount: 2, sortNo: 1, updatedBy: '赵昕玥', updatedAt: '2024-11-07 15:24:53' },
  { id: '3', shipName: '长江壹号', cabinName: '长江壹号豪华套房', cabinCount: 6, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2022-09-01 14:25:19' },
  { id: '4', shipName: '长江壹号', cabinName: '长江壹号观景房', cabinCount: 2, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2023-02-02 09:15:19' },
  { id: '5', shipName: '长江壹号', cabinName: '长江壹号行政房', cabinCount: 4, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2023-02-02 09:15:34' },
  { id: '6', shipName: '长江壹号', cabinName: '长江壹号总统套房', cabinCount: 2, guestCapacity: 3, bedCount: 2, sortNo: 3, updatedBy: '彭琳', updatedAt: '2022-09-01 14:25:25' },
]

const shipOptions = ['all', '长江壹号', '长江叁号']

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function createDefaultPricingRule(): CabinPricingRule {
  const now = new Date()
  return {
    effectiveStart: formatDateInput(now),
    effectiveEnd: formatDateInput(new Date(now.getFullYear(), 11, 31)),
    ruleMode: 'standard',
    singleSharedFactor: 0.5,
    standardTwoAdultFactor: 1,
    singleRoomFactor: 1.8,
    oneAdultOneChildBedFactor: 1,
    twoAdultOneBabyFactor: 1,
    thirdChildNoBedFactor: 0.3,
    thirdChildExtraBedFactor: 0.5,
    threeAdultExtraBedFactor: 1.5,
  }
}

const factorRuleFields: Array<{ key: keyof CabinPricingRule; label: string }> = [
  { key: 'singleSharedFactor', label: '单人（拼房）' },
  { key: 'standardTwoAdultFactor', label: '标准（2成人）' },
  { key: 'singleRoomFactor', label: '单间' },
  { key: 'oneAdultOneChildBedFactor', label: '一大一小（儿童/婴儿占床）' },
  { key: 'twoAdultOneBabyFactor', label: '两大一婴儿' },
  { key: 'thirdChildNoBedFactor', label: '第三人-儿童不占床' },
  { key: 'thirdChildExtraBedFactor', label: '第三人-儿童加床' },
  { key: 'threeAdultExtraBedFactor', label: '三大一成人加床' },
]

export default function PricingRulePage() {
  const [shipFilter, setShipFilter] = useState('all')
  const [appliedShipFilter, setAppliedShipFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [pricingRecord, setPricingRecord] = useState<PricingRuleRecord | null>(null)
  const [pricingRule, setPricingRule] = useState<CabinPricingRule | null>(null)
  const [pricingRulesByCabin, setPricingRulesByCabin] = useState<Record<string, CabinPricingRule>>({})
  const pageSize = 10

  const filteredData = useMemo(() => {
    if (appliedShipFilter === 'all') return pricingRuleData
    return pricingRuleData.filter((item) => item.shipName === appliedShipFilter)
  }, [appliedShipFilter])

  const dataSource = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page])

  const openPricingRule = (record: PricingRuleRecord) => {
    setPricingRecord(record)
    setPricingRule(pricingRulesByCabin[record.id] || createDefaultPricingRule())
    setPricingOpen(true)
  }

  const updatePricingRule = (field: keyof CabinPricingRule, value: string | number) => {
    setPricingRule((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const savePricingRule = () => {
    if (!pricingRecord || !pricingRule) return
    setPricingRulesByCabin((prev) => ({ ...prev, [pricingRecord.id]: pricingRule }))
    setPricingOpen(false)
  }

  const columns = [
    {
      key: 'index',
      title: '序号',
      width: '80px',
      render: (record: PricingRuleRecord) => filteredData.findIndex((item) => item.id === record.id) + 1,
    },
    { key: 'shipName', title: '船舶', dataIndex: 'shipName' as keyof PricingRuleRecord, width: '120px' },
    { key: 'cabinName', title: '船舱名称', dataIndex: 'cabinName' as keyof PricingRuleRecord },
    { key: 'cabinCount', title: '船舱数量', dataIndex: 'cabinCount' as keyof PricingRuleRecord, width: '120px' },
    { key: 'guestCapacity', title: '客容量', dataIndex: 'guestCapacity' as keyof PricingRuleRecord, width: '100px' },
    { key: 'bedCount', title: '床位数', dataIndex: 'bedCount' as keyof PricingRuleRecord, width: '100px' },
    { key: 'sortNo', title: '排序号', dataIndex: 'sortNo' as keyof PricingRuleRecord, width: '100px' },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof PricingRuleRecord, width: '120px' },
    { key: 'updatedAt', title: '修改时间', dataIndex: 'updatedAt' as keyof PricingRuleRecord, width: '180px' },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: (record: PricingRuleRecord) => (
        <button onClick={() => openPricingRule(record)} className="text-sm text-blue-600 hover:text-blue-700">
          定价规则
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="定价规则" />

      <SearchPanel
        onSearch={() => {
          setAppliedShipFilter(shipFilter)
          setPage(1)
        }}
        onReset={() => {
          setShipFilter('all')
          setAppliedShipFilter('all')
          setPage(1)
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">船舶</label>
          <select
            value={shipFilter}
            onChange={(e) => setShipFilter(e.target.value)}
            className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {shipOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? '全部' : option}
              </option>
            ))}
          </select>
        </div>
      </SearchPanel>

      <DataTable
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: filteredData.length,
          onChange: setPage,
        }}
      />

      <FormDialog
        open={pricingOpen && !!pricingRecord && !!pricingRule}
        title={`定价规则 - ${pricingRecord?.cabinName || ''}`}
        width="max-w-3xl"
        onCancel={() => setPricingOpen(false)}
        onSubmit={savePricingRule}
        submitText="保存规则"
      >
        {pricingRecord && pricingRule && (
          <div className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="block text-xs text-gray-500">船舶</span>
                  <span className="mt-1 block font-medium text-gray-900">{pricingRecord.shipName}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">船舱数量</span>
                  <span className="mt-1 block font-medium text-gray-900">{pricingRecord.cabinCount} 间</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">客容量/床位</span>
                  <span className="mt-1 block font-medium text-gray-900">
                    {pricingRecord.guestCapacity} 人 / {pricingRecord.bedCount} 床
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">生效范围</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">生效开始日期</label>
                  <input type="date" value={pricingRule.effectiveStart} onChange={(e) => updatePricingRule('effectiveStart', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">生效结束日期</label>
                  <input type="date" value={pricingRule.effectiveEnd} onChange={(e) => updatePricingRule('effectiveEnd', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">规则模式</label>
                  <select value={pricingRule.ruleMode} onChange={(e) => updatePricingRule('ruleMode', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="standard">标准价</option>
                    <option value="seasonal">季节价</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">系数规则</h4>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                {factorRuleFields.map((field, index) => (
                  <div
                    key={field.key}
                    className={`flex items-center justify-between gap-4 bg-white px-4 py-3 ${
                      index === factorRuleFields.length - 1 ? '' : 'border-b border-gray-200'
                    }`}
                  >
                    <label className="text-sm font-medium text-gray-700">{field.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={pricingRule[field.key] as number}
                        onChange={(e) => updatePricingRule(field.key, Number(e.target.value))}
                        className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-right text-sm"
                      />
                      <span className="text-xs text-gray-400">系数</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">附加费用</h4>
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-400">
                暂未配置附加费用项
              </div>
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  )
}
