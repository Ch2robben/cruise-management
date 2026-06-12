import { useMemo, useState } from 'react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'

type CabinRecord = {
  id: string
  shipName: string
  cabinName: string
  cabinCount: number
  guestCapacity: number
  bedCount: number
  sortNo: number
  updatedBy: string
  updatedAt: string
  alertEnabled?: boolean
  alertType?: 'percentage' | 'quantity'
  alertValue?: number
  countDimension?: 'room' | 'bed'
}

type CabinPricingRule = {
  effectiveStart: string
  effectiveEnd: string
  excludeDates: string[]
  variables: Record<PricingVariableKey, number>
  floorRules: FloorPricingRule[]
  formulaRules: FormulaPricingRule[]
}

type PricingVariableKey = 'P' | 'S'

type FloorPricingRule = {
  floor: number
  label: string
  formulaPrefix: string
  floorLevel: number
}

type FormulaRuleKey =
  | 'standard'
  | 'singleRoom'
  | 'oneAdultOneChild'
  | 'twoAdultsOneBaby'
  | 'thirdChildNoBed'
  | 'thirdChildExtraBed'
  | 'thirdAdultExtraBed'
  | 'custom'

type FormulaPricingRule = {
  id: string
  floor: string
  scenario: FormulaRuleKey
  scenarioName: string
  formula: string
  enabled: boolean
}

const initialCabinData: CabinRecord[] = [
  { id: '1', shipName: '长江叁号', cabinName: '长江叁号豪华阳台标准间', cabinCount: 500, guestCapacity: 3, bedCount: 2, sortNo: 1, updatedBy: '彭琳', updatedAt: '2024-11-07 14:35:11', alertEnabled: true, alertType: 'percentage', alertValue: 10, countDimension: 'room' },
  { id: '2', shipName: '长江叁号', cabinName: '标准间', cabinCount: 500, guestCapacity: 3, bedCount: 2, sortNo: 1, updatedBy: '赵昕玥', updatedAt: '2024-11-07 15:24:53', countDimension: 'room' },
  { id: '3', shipName: '长江壹号', cabinName: '长江壹号豪华套房', cabinCount: 6, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2022-09-01 14:25:19', countDimension: 'room' },
  { id: '4', shipName: '长江壹号', cabinName: '长江壹号观景房', cabinCount: 2, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2023-02-02 09:15:19' },
  { id: '5', shipName: '长江壹号', cabinName: '长江壹号行政房', cabinCount: 4, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2023-02-02 09:15:34' },
  { id: '6', shipName: '长江壹号', cabinName: '长江壹号总统套房', cabinCount: 2, guestCapacity: 3, bedCount: 2, sortNo: 3, updatedBy: '彭琳', updatedAt: '2022-09-01 14:25:25' },
]

const shipOptions = ['all', '长江壹号', '长江叁号']

const variableLabels: Record<PricingVariableKey, string> = {
  P: '公式基数',
  S: '楼层费',
}

const deckOptions = ['全部', '1F', '2F', '3F']

const defaultFormulaRules: FormulaPricingRule[] = [
  { id: 'f-2-standard',   floor: '1F',   scenario: 'standard',          scenarioName: '标准（2成人）',       formula: '2P',              enabled: true },
  { id: 'f-3-standard',   floor: '2F',   scenario: 'standard',          scenarioName: '标准（2成人）',       formula: '2(P + S)',        enabled: true },
  { id: 'f-4-standard',   floor: '3F',   scenario: 'standard',          scenarioName: '标准（2成人）',       formula: '2(P + S * 2)',    enabled: true },
  { id: 'f-2-single',     floor: '1F',   scenario: 'singleRoom',        scenarioName: '单间',               formula: '1.75P',           enabled: true },
  { id: 'f-3-single',     floor: '2F',   scenario: 'singleRoom',        scenarioName: '单间',               formula: '1.75(P + S)',     enabled: true },
  { id: 'f-4-single',     floor: '3F',   scenario: 'singleRoom',        scenarioName: '单间',               formula: '1.75(P + S * 2)', enabled: true },
  { id: 'f-child-bed',    floor: '全部', scenario: 'oneAdultOneChild',  scenarioName: '一大一小（儿童占床）', formula: '1.7P + S',        enabled: true },
  { id: 'f-baby',         floor: '全部', scenario: 'twoAdultsOneBaby', scenarioName: '两大一婴儿',         formula: '2.1P + S',        enabled: true },
  { id: 'f-third-nobed',  floor: '全部', scenario: 'thirdChildNoBed',   scenarioName: '第三人儿童不占床',   formula: '1.5P',            enabled: true },
  { id: 'f-third-bed',    floor: '全部', scenario: 'thirdChildExtraBed',scenarioName: '第三人儿童加床',     formula: '1.6P',            enabled: true },
  { id: 'f-third-adult',  floor: '全部', scenario: 'thirdAdultExtraBed',scenarioName: '三大成人加床',       formula: '2P',              enabled: true },
]

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function evaluateFormula(formula: string, p: number, s: number): number {
  if (!formula) return 0
  try {
    let expr = formula.replace(/([\d\.]+)([A-Za-z\(])/g, '$1*$2')
    expr = expr.replace(/P/g, String(p)).replace(/S/g, String(s))
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + expr)()
    return Number.isFinite(result) ? Math.round(result) : 0
  } catch (e) {
    return 0
  }
}

function createDefaultPricingRule(record: CabinRecord): CabinPricingRule {
  const now = new Date()
  return {
    effectiveStart: formatDateInput(now),
    effectiveEnd: formatDateInput(new Date(now.getFullYear(), 11, 31)),
    excludeDates: [],
    variables: {
      P: Math.max(800, record.guestCapacity * 600 + record.bedCount * 300),
      S: 180,
    },
    floorRules: [
      { floor: 1, label: '1F', formulaPrefix: 'P', floorLevel: 0 },
      { floor: 2, label: '2F', formulaPrefix: 'P + S', floorLevel: 1 },
      { floor: 3, label: '3F', formulaPrefix: 'P + S * 2', floorLevel: 2 },
    ],
    formulaRules: defaultFormulaRules.map((item) => ({ ...item })),
  }
}

export default function CabinPage() {
  const [records, setRecords] = useState<CabinRecord[]>(initialCabinData)
  const [shipFilter, setShipFilter] = useState('all')
  const [appliedShipFilter, setAppliedShipFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [pricingEditMode, setPricingEditMode] = useState(false)
  const [pricingCabin, setPricingCabin] = useState<CabinRecord | null>(null)
  const [pricingRule, setPricingRule] = useState<CabinPricingRule | null>(null)
  const [pricingRulesByCabin, setPricingRulesByCabin] = useState<Record<string, CabinPricingRule>>({})
  
  const [editCabinOpen, setEditCabinOpen] = useState(false)
  const [editCabin, setEditCabin] = useState<CabinRecord | null>(null)
  
  const pageSize = 10

  const filteredData = useMemo(() => {
    if (appliedShipFilter === 'all') return records
    return records.filter((item) => item.shipName === appliedShipFilter)
  }, [appliedShipFilter, records])

  const dataSource = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page])

  const openPricingRule = (record: CabinRecord) => {
    setPricingCabin(record)
    setPricingRule(pricingRulesByCabin[record.id] || createDefaultPricingRule(record))
    setPricingEditMode(false)
    setPricingOpen(true)
  }

  const updatePricingRule = (field: 'effectiveStart' | 'effectiveEnd', value: string) => {
    setPricingRule((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  const toggleExcludeDate = (date: string) => {
    setPricingRule((prev) => {
      if (!prev) return prev
      const dates = prev.excludeDates || []
      const newDates = dates.includes(date)
        ? dates.filter(d => d !== date)
        : [...dates, date].sort()
      return { ...prev, excludeDates: newDates }
    })
  }

  const updateVariable = (key: PricingVariableKey, value: number) => {
    setPricingRule((prev) => prev ? {
      ...prev,
      variables: { ...prev.variables, [key]: value },
    } : prev)
  }

  const updateFloorRule = (index: number, field: keyof FloorPricingRule, value: string | number) => {
    setPricingRule((prev) => {
      if (!prev) return prev
      const floorRules = [...prev.floorRules]
      floorRules[index] = { ...floorRules[index], [field]: value }
      return { ...prev, floorRules }
    })
  }

  const updateFormulaRule = (index: number, field: keyof Pick<FormulaPricingRule, 'formula' | 'enabled' | 'floor' | 'scenarioName'>, value: string | boolean) => {
    setPricingRule((prev) => {
      if (!prev) return prev
      const formulaRules = [...prev.formulaRules]
      formulaRules[index] = { ...formulaRules[index], [field]: value }
      return { ...prev, formulaRules }
    })
  }

  const addFormulaRule = () => {
    setPricingRule((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        formulaRules: [
          ...prev.formulaRules,
          {
            id: 'custom-' + Date.now(),
            floor: '全部',
            scenario: 'custom',
            scenarioName: '新规则',
            formula: 'P',
            enabled: true,
          }
        ]
      }
    })
  }

  const removeFormulaRule = (id: string) => {
    setPricingRule((prev) => {
      if (!prev) return prev
      return { ...prev, formulaRules: prev.formulaRules.filter(r => r.id !== id) }
    })
  }

  const savePricingRule = () => {
    if (!pricingCabin || !pricingRule) return
    setPricingRulesByCabin((prev) => ({ ...prev, [pricingCabin.id]: pricingRule }))
    setPricingEditMode(false)
    setPricingOpen(false)
  }

  const columns = [
    {
      key: 'index',
      title: '序号',
      width: '80px',
      render: (r: CabinRecord) => filteredData.findIndex((item) => item.id === r.id) + 1,
    },
    { key: 'shipName', title: '船舶', dataIndex: 'shipName' as keyof CabinRecord, width: '120px' },
    { key: 'cabinName', title: '船舱名称', dataIndex: 'cabinName' as keyof CabinRecord },
    { key: 'cabinCount', title: '船舱数量', dataIndex: 'cabinCount' as keyof CabinRecord, width: '120px' },
    { key: 'guestCapacity', title: '客容量', dataIndex: 'guestCapacity' as keyof CabinRecord, width: '100px' },
    { key: 'bedCount', title: '床位数', dataIndex: 'bedCount' as keyof CabinRecord, width: '100px' },
    { key: 'sortNo', title: '排序号', dataIndex: 'sortNo' as keyof CabinRecord, width: '100px' },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof CabinRecord, width: '120px' },
    { key: 'updatedAt', title: '修改时间', dataIndex: 'updatedAt' as keyof CabinRecord, width: '180px' },
    {
      key: 'actions',
      title: '操作',
      width: '260px',
      render: (record: CabinRecord) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditCabin({ ...record }); setEditCabinOpen(true); }} className="text-base text-blue-600 hover:text-blue-700">编辑</button>
          <span className="text-gray-300">|</span>
          <button className="text-base text-red-500 hover:text-red-600">删除</button>
          <button className="ml-3 text-sm text-gray-500 hover:text-gray-700">详情</button>
          {/* <button onClick={() => openPricingRule(record)} className="text-sm text-blue-600 hover:text-blue-700">定价规则</button> */}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="船舱管理" />

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
        open={editCabinOpen}
        title="编辑船舱"
        width="max-w-2xl"
        onCancel={() => setEditCabinOpen(false)}
        onSubmit={() => {
          if (editCabin) {
            setRecords(prev => prev.map(r => r.id === editCabin.id ? editCabin : r))
          }
          setEditCabinOpen(false)
        }}
      >
        {editCabin && (
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">船舶</label>
                  <input value={editCabin.shipName} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">船舱名称</label>
                  <input value={editCabin.cabinName} onChange={(e) => setEditCabin({ ...editCabin, cabinName: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">船舱数量</label>
                  <input type="number" value={editCabin.cabinCount} onChange={(e) => setEditCabin({ ...editCabin, cabinCount: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">客容量</label>
                  <input type="number" value={editCabin.guestCapacity} onChange={(e) => setEditCabin({ ...editCabin, guestCapacity: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">床位数</label>
                  <input type="number" value={editCabin.bedCount} onChange={(e) => setEditCabin({ ...editCabin, bedCount: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">计数维度</label>
                  <select 
                    value={editCabin.countDimension || 'room'} 
                    onChange={(e) => setEditCabin({ ...editCabin, countDimension: e.target.value as 'room' | 'bed' })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="room">按间计数</option>
                    <option value="bed">按床计数</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">预警设置</h4>
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-medium text-gray-900">库存预警</span>
                    <span className="mt-1 block text-xs text-gray-500">开启后，当该船舱的剩余库存低于设定阈值时会触发预警</span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" checked={editCabin.alertEnabled || false} onChange={(e) => setEditCabin({ ...editCabin, alertEnabled: e.target.checked })} />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>

                {editCabin.alertEnabled && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex items-end gap-4">
                      <div className="w-48">
                        <label className="mb-1 block text-sm text-gray-700">预警规则</label>
                        <select 
                          value={editCabin.alertType || 'percentage'} 
                          onChange={(e) => setEditCabin({ ...editCabin, alertType: e.target.value as 'percentage' | 'quantity' })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          <option value="percentage">按剩余库存百分比</option>
                          <option value="quantity">按剩余库存数量</option>
                        </select>
                      </div>
                      <div className="w-40">
                        <label className="mb-1 block text-sm text-gray-700">阈值</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={editCabin.alertValue || 0} 
                            onChange={(e) => setEditCabin({ ...editCabin, alertValue: Number(e.target.value) })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900 pr-8" 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            {(editCabin.alertType || 'percentage') === 'percentage' ? '%' : '间'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </FormDialog>

      <FormDialog
        open={pricingOpen && !!pricingCabin && !!pricingRule}
        title={`定价规则 - ${pricingCabin?.cabinName || ''}`}
        width="max-w-6xl"
        onCancel={() => { setPricingOpen(false); setPricingEditMode(false) }}
        onSubmit={pricingEditMode ? savePricingRule : undefined}
        submitText="保存规则"
      >
        {pricingCabin && pricingRule && (
          <div className="space-y-5">

            {/* 头部信息 + 编辑按鈕 */}
            <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="block text-xs text-gray-500">船舶</span>
                    <span className="mt-1 block font-medium text-gray-900">{pricingCabin.shipName}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">船舱数量</span>
                    <span className="mt-1 block font-medium text-gray-900">{pricingCabin.cabinCount} 间</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">容量/床位</span>
                    <span className="mt-1 block font-medium text-gray-900">{pricingCabin.guestCapacity} 人 / {pricingCabin.bedCount} 床</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPricingEditMode((v) => !v)}
                className={`h-10 px-4 rounded-lg text-sm font-medium border transition-colors ${
                  pricingEditMode
                    ? 'border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pricingEditMode ? '退出编辑' : '编辑'}
              </button>
            </div>

            {/* 生效范围 */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">生效范围</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">生效开始日期</label>
                  {pricingEditMode
                    ? <input type="date" value={pricingRule.effectiveStart} onChange={(e) => updatePricingRule('effectiveStart', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    : <p className="mt-1 text-sm font-medium text-gray-900">{pricingRule.effectiveStart}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">生效结束日期</label>
                  {pricingEditMode
                    ? <input type="date" value={pricingRule.effectiveEnd} onChange={(e) => updatePricingRule('effectiveEnd', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    : <p className="mt-1 text-sm font-medium text-gray-900">{pricingRule.effectiveEnd}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">排除日期</label>
                  {pricingEditMode
                    ? (
                      <div className="flex flex-col gap-2">
                        <input 
                          type="date" 
                          onChange={(e) => {
                            if (e.target.value) {
                              toggleExcludeDate(e.target.value)
                              e.target.value = ''
                            }
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" 
                        />
                        <div className="flex flex-wrap gap-1">
                          {pricingRule.excludeDates?.map(d => (
                            <span key={d} className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                              {d}
                              <button onClick={() => toggleExcludeDate(d)} className="text-gray-400 hover:text-red-500">&times;</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                    : (
                      <div className="mt-1 flex flex-wrap gap-1 max-h-[60px] overflow-auto">
                        {pricingRule.excludeDates?.length ? pricingRule.excludeDates.map(d => (
                          <span key={d} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{d}</span>
                        )) : <span className="text-sm text-gray-500 mt-1">无</span>}
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-4">
              {/* 左：基础变量 */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基础变量</h4>
                <div className="flex flex-col gap-3">
                  {(Object.keys(pricingRule.variables) as PricingVariableKey[]).map((key) => (
                    <VariableInput
                      key={key}
                      code={key}
                      label={variableLabels[key]}
                      value={pricingRule.variables[key]}
                      editMode={pricingEditMode}
                      onChange={(value) => updateVariable(key, value)}
                    />
                  ))}
                </div>
              </div>

              {/* 右：楼层费规则 */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">楼层费规则</h4>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs text-gray-500">甲板层</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">公式基底</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">计算结果</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">层级</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pricingRule.floorRules.map((row, index) => (
                        <tr key={row.floor}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.label}</td>
                          <td className="px-3 py-2">
                            {pricingEditMode
                              ? <input value={row.formulaPrefix} onChange={(e) => updateFloorRule(index, 'formulaPrefix', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs" />
                              : <span className="font-mono text-xs text-gray-700">{row.formulaPrefix}</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-blue-600">
                            ¥{evaluateFormula(row.formulaPrefix, pricingRule.variables.P, pricingRule.variables.S).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {pricingEditMode
                              ? <input type="number" value={row.floorLevel} onChange={(e) => updateFloorRule(index, 'floorLevel', Number(e.target.value))} className="w-16 rounded border border-gray-300 px-2 py-1.5 text-right text-xs" />
                              : <span className="text-xs text-gray-700">{row.floorLevel}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 下：入住组合公式单独一层 */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">入住组合公式</h4>
                <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-600">
                  提示：此处只维护价格系数与入住组合的关系，价格只做展示，具体价格在航次模板中维护
                </span>
              </div>
              <div className="max-h-[360px] overflow-auto rounded-lg border border-gray-200">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs text-gray-500">甲板层</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">入住组合</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">公式</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">计算结果</th>
                        <th className="px-3 py-2 text-center text-xs text-gray-500">启用</th>
                        {pricingEditMode && <th className="px-3 py-2 text-center text-xs text-gray-500">操作</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pricingRule.formulaRules.map((row, index) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {pricingEditMode
                              ? <select value={row.floor} onChange={(e) => updateFormulaRule(index, 'floor', e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-xs">
                                  {deckOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              : <span className="text-gray-500">{row.floor}</span>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                            {pricingEditMode
                              ? <input value={row.scenarioName} onChange={(e) => updateFormulaRule(index, 'scenarioName', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                              : row.scenarioName}
                          </td>
                          <td className="px-3 py-2">
                            {pricingEditMode
                              ? <input value={row.formula} onChange={(e) => updateFormulaRule(index, 'formula', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs" />
                              : <span className="font-mono text-xs text-gray-700">{row.formula}</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-blue-600">
                            ¥{evaluateFormula(row.formula, pricingRule.variables.P, pricingRule.variables.S).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {pricingEditMode
                              ? <input type="checkbox" checked={row.enabled} onChange={(e) => updateFormulaRule(index, 'enabled', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                              : <span className={`inline-block h-2 w-2 rounded-full ${row.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />}
                          </td>
                          {pricingEditMode && (
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => removeFormulaRule(row.id)} className="text-red-500 hover:text-red-600 text-xs">删除</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pricingEditMode && (
                  <button onClick={addFormulaRule} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                    + 新增入住组合规则
                  </button>
                )}
              </div>
          </div>
        )}
      </FormDialog>
    </div>
  )
}

function VariableInput({ code, label, value, editMode, onChange }: { code: PricingVariableKey; label: string; value: number; editMode: boolean; onChange: (value: number) => void }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-base font-semibold text-gray-900">{code}</span>
        <span className="truncate text-xs text-gray-500">{label}</span>
      </div>
      {editMode
        ? <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-right text-sm" />
        : <p className="mt-2 text-right text-lg font-semibold text-gray-900">{value.toLocaleString()}</p>}
    </div>
  )
}
