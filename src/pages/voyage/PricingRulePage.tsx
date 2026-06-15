import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
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

type FactorRule = {
  id: string
  name: string
  floor?: string
  factor: number
  floorFee: number
}

type CabinPricingRule = {
  enabled: boolean
  factorRules: FactorRule[]
}

const pricingRuleData: PricingRuleRecord[] = [
  { id: '1', shipName: '长江叁号', cabinName: '长江叁号豪华阳台标准间', cabinCount: 500, guestCapacity: 3, bedCount: 2, sortNo: 1, updatedBy: '彭琳', updatedAt: '2024-11-07 14:35:11' },
  { id: '2', shipName: '长江叁号', cabinName: '标准间', cabinCount: 500, guestCapacity: 3, bedCount: 2, sortNo: 1, updatedBy: '赵昕玥', updatedAt: '2024-11-07 15:24:53' },
  { id: '3', shipName: '长江壹号', cabinName: '长江壹号豪华套房', cabinCount: 6, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2022-09-01 14:25:19' },
  { id: '4', shipName: '长江壹号', cabinName: '长江壹号观景房', cabinCount: 2, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2023-02-02 09:15:19' },
  { id: '5', shipName: '长江壹号', cabinName: '长江壹号行政房', cabinCount: 4, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2023-02-02 09:15:34' },
  { id: '6', shipName: '长江壹号', cabinName: '长江壹号总统套房', cabinCount: 2, guestCapacity: 3, bedCount: 2, sortNo: 3, updatedBy: '彭琳', updatedAt: '2022-09-01 14:25:25' },
]

const FACTOR_RULE_NAMES = [
  '单人（拼房）',
  '标准（2成人）',
  '单间',
  '一大一小（儿童/婴儿占床）',
  '两大一婴儿',
  '第三人-儿童不占床',
  '第三人-儿童加床',
  '三大一成人加床',
]

const shipOptions = ['all', '长江壹号', '长江叁号']

const defaultFactorRules: FactorRule[] = [
  { id: '1', name: '单人（拼房）', floor: '1F', factor: 0.5, floorFee: 0 },
  { id: '2', name: '标准（2成人）', floor: '1F', factor: 1, floorFee: 0 },
  { id: '3', name: '单间', floor: '1F', factor: 1.8, floorFee: 0 },
  { id: '4', name: '一大一小（儿童/婴儿占床）', floor: '1F', factor: 1, floorFee: 0 },
  { id: '5', name: '两大一婴儿', floor: '1F', factor: 1, floorFee: 0 },
  { id: '6', name: '第三人-儿童不占床', floor: '1F', factor: 0.3, floorFee: 0 },
  { id: '7', name: '第三人-儿童加床', floor: '1F', factor: 0.5, floorFee: 0 },
  { id: '8', name: '三大一成人加床', floor: '1F', factor: 1.5, floorFee: 0 },
]

function createDefaultPricingRule(): CabinPricingRule {
  return {
    enabled: true,
    factorRules: [...defaultFactorRules],
  }
}

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

  const updatePricingRule = (field: keyof CabinPricingRule, value: any) => {
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
          船舱房型定价规则
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="船舱房型定价规则" />

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
        title={`船舱房型定价规则 - ${pricingRecord?.cabinName || ''}`}
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
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基本设置</h4>
              <div className="mb-4">
                <label className="mb-1 block text-sm text-gray-700">状态</label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={pricingRule.enabled} 
                    onChange={(e) => updatePricingRule('enabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">启用该定价规则</span>
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">系数规则</h4>
                <button
                  type="button"
                  onClick={() => updatePricingRule('factorRules', [...pricingRule.factorRules, { id: Date.now().toString(), name: '', floor: '1F', factor: 1, floorFee: 0 }])}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" /> 添加规则
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                {pricingRule.factorRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between gap-4 bg-white px-4 py-3 ${
                      index === pricingRule.factorRules.length - 1 ? '' : 'border-b border-gray-200'
                    }`}
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <select 
                        value={rule.name} 
                        onChange={(e) => {
                          const newRules = [...pricingRule.factorRules]
                          newRules[index].name = e.target.value
                          updatePricingRule('factorRules', newRules)
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                      >
                        <option value="" disabled>请选择系数规则</option>
                        {FACTOR_RULE_NAMES.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <select
                        value={rule.floor || ''}
                        onChange={(e) => {
                          const newRules = [...pricingRule.factorRules]
                          newRules[index].floor = e.target.value
                          updatePricingRule('factorRules', newRules)
                        }}
                        className="w-24 shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                      >
                        <option value="" disabled>选择楼层</option>
                        <option value="1F">1F</option>
                        <option value="2F">2F</option>
                        <option value="3F">3F</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={rule.factor}
                          onChange={(e) => {
                            const newRules = [...pricingRule.factorRules]
                            newRules[index].factor = Number(e.target.value)
                            updatePricingRule('factorRules', newRules)
                          }}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-right text-sm focus:border-blue-500 outline-none"
                        />
                        <span className="text-xs text-gray-500 w-8">系数</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="1"
                          value={rule.floorFee}
                          onChange={(e) => {
                            const newRules = [...pricingRule.factorRules]
                            newRules[index].floorFee = Number(e.target.value)
                            updatePricingRule('factorRules', newRules)
                          }}
                          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-right text-sm focus:border-blue-500 outline-none"
                        />
                        <span className="text-xs text-gray-500 w-12">楼层费</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newRules = pricingRule.factorRules.filter(r => r.id !== rule.id)
                          updatePricingRule('factorRules', newRules)
                        }}
                        className="text-gray-400 hover:text-red-500 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {pricingRule.factorRules.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">暂无规则，请点击上方添加</div>
                )}
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
