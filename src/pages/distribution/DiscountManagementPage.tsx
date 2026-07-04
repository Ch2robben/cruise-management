import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy, Edit3, Plus, Trash2, X } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import ConfirmDialog from '@/components/common/ConfirmDialog'

type DiscountType = '立减优惠' | '年龄优惠' | '限时优惠' | '折扣优惠' | '渠道优惠'
type DiscountStatus = '启用' | '停用'
type DiscountScene = '2B' | '2C'
type ChannelDiscountMode = '满减优惠' | '团队全陪票'

interface DiscountRule {
  id: string
  name: string
  type: DiscountType
  discountValue: number
  discountUnit: '元' | '折'
  settlementReduction: number
  stock: number
  scenes: DiscountScene[]
  channelMode?: ChannelDiscountMode
  channelThreshold?: number
  channelReduction?: number
  escortTeamMin?: number
  escortTeamMax?: number
  sailingCount: number
  cabinCount: number
  validPeriod: string
  status: DiscountStatus
  updatedAt: string
}

const initialRules: DiscountRule[] = [
  {
    id: 'DR20260701001',
    name: '暑期阳台房立减',
    type: '立减优惠',
    discountValue: 300,
    discountUnit: '元',
    settlementReduction: 100,
    stock: 999,
    scenes: ['2B'],
    sailingCount: 8,
    cabinCount: 18,
    validPeriod: '2026-07-06 至 2026-08-24',
    status: '启用',
    updatedAt: '2026-07-01 15:30',
  },
  {
    id: 'DR20260618002',
    name: '长者出行专享',
    type: '年龄优惠',
    discountValue: 200,
    discountUnit: '元',
    settlementReduction: 80,
    stock: 300,
    scenes: ['2B', '2C'],
    sailingCount: 12,
    cabinCount: 24,
    validPeriod: '2026-07-06 至 2026-09-21',
    status: '启用',
    updatedAt: '2026-06-28 09:18',
  },
  {
    id: 'DR20260612003',
    name: '限时早鸟特惠',
    type: '限时优惠',
    discountValue: 500,
    discountUnit: '元',
    settlementReduction: 200,
    stock: 100,
    scenes: ['2C'],
    sailingCount: 4,
    cabinCount: 15,
    validPeriod: '2026-07-06 至 2026-07-27',
    status: '停用',
    updatedAt: '2026-06-22 11:45',
  },
  {
    id: 'DR20260526004',
    name: '套房九折活动',
    type: '折扣优惠',
    discountValue: 9,
    discountUnit: '折',
    settlementReduction: 0,
    stock: 80,
    scenes: ['2B'],
    sailingCount: 6,
    cabinCount: 9,
    validPeriod: '2026-08-03 至 2026-09-07',
    status: '启用',
    updatedAt: '2026-06-20 16:08',
  },
  {
    id: 'DR20260704005',
    name: '同业渠道暑期团队礼遇',
    type: '渠道优惠',
    discountValue: 0,
    discountUnit: '元',
    settlementReduction: 0,
    stock: 120,
    scenes: ['2B'],
    channelMode: '团队全陪票',
    escortTeamMin: 10,
    escortTeamMax: 20,
    sailingCount: 5,
    cabinCount: 12,
    validPeriod: '2026-07-06 至 2026-08-10',
    status: '启用',
    updatedAt: '2026-07-04 11:20',
  },
]

const sailings = [
  '2026-07-06',
  '2026-07-13',
  '2026-07-20',
  '2026-07-27',
  '2026-08-03',
  '2026-08-10',
  '2026-08-17',
  '2026-08-24',
  '2026-08-31',
  '2026-09-07',
  '2026-09-14',
]

const balconyCabins = [
  '家庭客房（4-4） DF',
  '家庭客房（2大1小，1小无床）（3-3） DF',
  '家庭客房（3-3） DF',
  '行政客房（2大2小，1小加床1小无床）（4-4） EC6-4',
  '行政客房（第三人加床）（3-3） EC6-4',
  '行政客房（2大1小，1小无床）（3-3） EC6-3',
  '行政客房（双人间）（2-2） EC6-2',
  '阳台大床房（2大2小，1小加床1小无床）（4-4） DC6-4',
  '阳台大床房（第三人加床）（3-3） DC6-4',
  '阳台大床房（2大1小，1小无床）（3-3） DC6-3',
  '阳台大床房（双人间）（2-2） DC6-2',
  '阳台大床房（2大2小，1小加床1小无床）（4-4） DC5-4',
  '阳台大床房（第三人加床）（3-3） DC5-4',
  '阳台标准间（2大2小，1小加床1小无床）（4-4） SC5-4',
  '阳台标准间（第三人加床）（3-3） SC5-4',
  '阳台标准间（2大1小，1小无床）（3-3） SC5-3',
  '阳台标准间（双人间）（2-2） SC5-2',
  '阳台标准间（2大2小，1小加床1小无床）（4-4） SC4-4',
]

const suiteCabins = [
  '总统套房（2人入住）（2-2） PS6-2',
  '豪华套房（2大1小）（3-3） LS6-3',
  '豪华套房（双人间）（2-2） LS6-2',
  '行政套房（第三人加床）（3-3） ES5-3',
  '行政套房（双人间）（2-2） ES5-2',
  '家庭套房（2大2小）（4-4） FS5-4',
]

interface ScopeOption {
  product: string
  route: string
  sailings: string[]
  cabins: {
    阳台房: string[]
    套房: string[]
  }
}

const scopeOptions: ScopeOption[] = [
  {
    product: '长江壹号·重庆至宜昌 11 日游',
    route: '重庆-丰都-奉节-宜昌',
    sailings: sailings.slice(0, 6),
    cabins: {
      阳台房: balconyCabins.slice(0, 10),
      套房: suiteCabins.slice(0, 4),
    },
  },
  {
    product: '长江探索号·三峡精华 7 日游',
    route: '重庆-巫山-宜昌',
    sailings: sailings.slice(2, 9),
    cabins: {
      阳台房: balconyCabins.slice(4, 15),
      套房: suiteCabins.slice(1, 5),
    },
  },
  {
    product: '长江叁号·武汉往返 5 日游',
    route: '武汉-九江-武汉',
    sailings: sailings.slice(5),
    cabins: {
      阳台房: balconyCabins.slice(8),
      套房: suiteCabins.slice(2),
    },
  },
]

const inputClass =
  'h-10 rounded border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

export default function DiscountManagementPage() {
  const [rules, setRules] = useState(initialRules)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ keyword: '', type: '', status: '' })
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<DiscountRule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DiscountRule | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  const filteredRules = useMemo(
    () =>
      rules.filter(
        (rule) =>
          (!appliedFilters.keyword || `${rule.name}${rule.id}`.includes(appliedFilters.keyword)) &&
          (!appliedFilters.type || rule.type === appliedFilters.type) &&
          (!appliedFilters.status || rule.status === appliedFilters.status),
      ),
    [rules, appliedFilters],
  )

  const openCreate = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const openEdit = (rule: DiscountRule) => {
    setEditing(rule)
    setEditorOpen(true)
  }

  const duplicateRule = (rule: DiscountRule) => {
    setRules((current) => [
      {
        ...rule,
        id: `DR${Date.now()}`,
        name: `${rule.name}（副本）`,
        status: '停用',
        updatedAt: '2026-07-04 10:00',
      },
      ...current,
    ])
    showToast('优惠规则已复制，请编辑后启用')
  }

  const columns = [
    { key: 'id', title: '规则编号', width: '150px', render: (rule: DiscountRule) => <span className="font-medium text-gray-900">{rule.id}</span> },
    {
      key: 'name',
      title: '优惠规则',
      render: (rule: DiscountRule) => (
        <div>
          <div className="font-medium text-gray-900">{rule.name}</div>
          <div className="mt-1 text-xs text-gray-400">{rule.validPeriod}</div>
        </div>
      ),
    },
    {
      key: 'type',
      title: '优惠类型',
      width: '110px',
      render: (rule: DiscountRule) => <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{rule.type}</span>,
    },
    {
      key: 'scenes',
      title: '适用场景',
      width: '120px',
      render: (rule: DiscountRule) => (
        <div className="flex flex-wrap gap-1">
          {rule.scenes.map((scene) => (
            <span key={scene} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
              {scene}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'value',
      title: '优惠力度',
      width: '180px',
      render: (rule: DiscountRule) => (
        <span className="font-semibold text-orange-600">
          {rule.type === '渠道优惠'
            ? rule.channelMode === '满减优惠'
              ? `满${rule.channelThreshold ?? 0}减${rule.channelReduction ?? 0}`
              : `${rule.escortTeamMin ?? 0}-${rule.escortTeamMax ?? 0}人减1张全陪票`
            : rule.discountUnit === '元'
              ? `¥${rule.discountValue}`
              : `${rule.discountValue}折`}
        </span>
      ),
    },
    { key: 'scope', title: '适用范围', width: '140px', render: (rule: DiscountRule) => `${rule.sailingCount} 个班期 / ${rule.cabinCount} 个房型` },
    { key: 'stock', title: '优惠库存', width: '90px', render: (rule: DiscountRule) => `${rule.stock} 份` },
    {
      key: 'status',
      title: '状态',
      width: '80px',
      render: (rule: DiscountRule) => (
        <button
          onClick={() => {
            const nextStatus = rule.status === '启用' ? '停用' : '启用'
            setRules((current) => current.map((item) => (item.id === rule.id ? { ...item, status: nextStatus } : item)))
            showToast(`规则已${nextStatus}`)
          }}
          className={`rounded px-2 py-1 text-xs font-medium ${
            rule.status === '启用' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {rule.status}
        </button>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '190px',
      render: (rule: DiscountRule) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEdit(rule)} className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
            <Edit3 className="h-3.5 w-3.5" /> 编辑
          </button>
          <button onClick={() => duplicateRule(rule)} className="flex items-center gap-1 text-gray-600 hover:text-gray-800">
            <Copy className="h-3.5 w-3.5" /> 复制
          </button>
          <button onClick={() => setDeleteTarget(rule)} className="flex items-center gap-1 text-red-500 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" /> 删除
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

      <PageHeader title="优惠管理">
        <button onClick={openCreate} className="flex h-10 items-center gap-2 rounded bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          新增优惠规则
        </button>
      </PageHeader>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <SearchPanel
          onSearch={() => setAppliedFilters({ keyword, type: typeFilter, status: statusFilter })}
          onReset={() => {
            setKeyword('')
            setTypeFilter('')
            setStatusFilter('')
            setAppliedFilters({ keyword: '', type: '', status: '' })
          }}
        >
          <label className="space-y-2">
            <span className="block text-sm text-gray-600">规则名称/编号</span>
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入关键词" className={`${inputClass} w-64`} />
          </label>
          <label className="space-y-2">
            <span className="block text-sm text-gray-600">优惠类型</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={`${inputClass} w-44`}>
              <option value="">全部类型</option>
              <option>立减优惠</option>
              <option>年龄优惠</option>
              <option>限时优惠</option>
              <option>折扣优惠</option>
              <option>渠道优惠</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-sm text-gray-600">状态</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={`${inputClass} w-36`}>
              <option value="">全部状态</option>
              <option>启用</option>
              <option>停用</option>
            </select>
          </label>
        </SearchPanel>
        <div className="flex items-center justify-between px-9 py-5">
          <span className="text-sm text-gray-500">共 {filteredRules.length} 条优惠规则</span>
          <span className="text-xs text-gray-400">优惠按优先级和创建时间自动匹配，不与同类型优惠叠加</span>
        </div>
        <DataTable columns={columns} dataSource={filteredRules} rowKey="id" />
      </div>

      {editorOpen && (
        <DiscountEditor
          initialRule={editing}
          onClose={() => setEditorOpen(false)}
          onSave={(form) => {
            if (editing) {
              setRules((current) => current.map((item) => (item.id === editing.id ? { ...item, ...form, updatedAt: '2026-07-04 10:00' } : item)))
              showToast('优惠规则已更新')
            } else {
              setRules((current) => [
                {
                  id: `DR${Date.now()}`,
                  updatedAt: '2026-07-04 10:00',
                  ...form,
                },
                ...current,
              ])
              showToast('优惠规则已新增')
            }
            setEditorOpen(false)
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除优惠规则"
        message={`确定删除“${deleteTarget?.name ?? ''}”吗？删除后无法恢复。`}
        confirmText="删除"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) setRules((current) => current.filter((item) => item.id !== deleteTarget.id))
          setDeleteTarget(null)
          showToast('优惠规则已删除')
        }}
      />
    </div>
  )
}

interface EditorForm {
  name: string
  type: DiscountType
  discountValue: number
  discountUnit: '元' | '折'
  settlementReduction: number
  stock: number
  scenes: DiscountScene[]
  channelMode?: ChannelDiscountMode
  channelThreshold?: number
  channelReduction?: number
  escortTeamMin?: number
  escortTeamMax?: number
  sailingCount: number
  cabinCount: number
  validPeriod: string
  status: DiscountStatus
}

function DiscountEditor({
  initialRule,
  onClose,
  onSave,
}: {
  initialRule: DiscountRule | null
  onClose: () => void
  onSave: (form: EditorForm) => void
}) {
  const [name, setName] = useState(initialRule?.name ?? '')
  const [type, setType] = useState<DiscountType>(initialRule?.type ?? '立减优惠')
  const [discountValue, setDiscountValue] = useState(initialRule?.discountValue ?? 300)
  const [settlementReduction, setSettlementReduction] = useState(initialRule?.settlementReduction ?? 100)
  const [stock, setStock] = useState(initialRule?.stock ?? 999)
  const [scenes, setScenes] = useState<DiscountScene[]>(initialRule?.scenes ?? ['2B'])
  const [channelMode, setChannelMode] = useState<ChannelDiscountMode>(initialRule?.channelMode ?? '满减优惠')
  const [channelThreshold, setChannelThreshold] = useState(initialRule?.channelThreshold ?? 3000)
  const [channelReduction, setChannelReduction] = useState(initialRule?.channelReduction ?? 300)
  const [escortTeamMin, setEscortTeamMin] = useState(initialRule?.escortTeamMin ?? 10)
  const [escortTeamMax, setEscortTeamMax] = useState(initialRule?.escortTeamMax ?? 20)
  const [productFilter, setProductFilter] = useState('')
  const [routeFilter, setRouteFilter] = useState('')
  const [activeSailing, setActiveSailing] = useState(sailings[0])
  const [selectedSailings, setSelectedSailings] = useState<string[]>(
    initialRule ? sailings.slice(0, Math.min(initialRule.sailingCount, sailings.length)) : [sailings[0]],
  )
  const [cabinTab, setCabinTab] = useState<'阳台房' | '套房'>('阳台房')
  const [selectedCabins, setSelectedCabins] = useState<string[]>(
    initialRule ? balconyCabins.slice(0, Math.min(initialRule.cabinCount, balconyCabins.length)) : [],
  )

  const productOptions = useMemo(() => Array.from(new Set(scopeOptions.map((item) => item.product))), [])
  const routeOptions = useMemo(
    () =>
      Array.from(
        new Set(scopeOptions.filter((item) => !productFilter || item.product === productFilter).map((item) => item.route)),
      ),
    [productFilter],
  )
  const matchedScopes = useMemo(
    () => scopeOptions.filter((item) => (!productFilter || item.product === productFilter) && (!routeFilter || item.route === routeFilter)),
    [productFilter, routeFilter],
  )
  const availableSailings = useMemo(() => Array.from(new Set(matchedScopes.flatMap((item) => item.sailings))), [matchedScopes])
  const balconyCabinOptions = useMemo(
    () => Array.from(new Set(matchedScopes.flatMap((item) => item.cabins.阳台房))),
    [matchedScopes],
  )
  const suiteCabinOptions = useMemo(() => Array.from(new Set(matchedScopes.flatMap((item) => item.cabins.套房))), [matchedScopes])
  const currentCabins = cabinTab === '阳台房' ? balconyCabinOptions : suiteCabinOptions
  const discountUnit: '元' | '折' = type === '折扣优惠' ? '折' : '元'

  useEffect(() => {
    if (!productFilter && productOptions.length > 0) {
      setProductFilter(productOptions[0])
    }
  }, [productFilter, productOptions])

  useEffect(() => {
    if (!routeOptions.length) {
      setRouteFilter('')
      return
    }
    if (!routeOptions.includes(routeFilter)) {
      setRouteFilter(routeOptions[0])
    }
  }, [routeFilter, routeOptions])

  useEffect(() => {
    if (!availableSailings.length) return
    if (!availableSailings.includes(activeSailing)) {
      setActiveSailing(availableSailings[0])
    }
    setSelectedSailings((current) => {
      const next = current.filter((item) => availableSailings.includes(item))
      return next.length > 0 ? next : [availableSailings[0]]
    })
  }, [activeSailing, availableSailings])

  useEffect(() => {
    const availableCabins = new Set([...balconyCabinOptions, ...suiteCabinOptions])
    setSelectedCabins((current) => current.filter((item) => availableCabins.has(item)))
    if (cabinTab === '阳台房' && balconyCabinOptions.length === 0 && suiteCabinOptions.length > 0) {
      setCabinTab('套房')
    }
    if (cabinTab === '套房' && suiteCabinOptions.length === 0 && balconyCabinOptions.length > 0) {
      setCabinTab('阳台房')
    }
  }, [balconyCabinOptions, suiteCabinOptions, cabinTab])

  const toggleCabin = (cabin: string) => {
    setSelectedCabins((current) => (current.includes(cabin) ? current.filter((item) => item !== cabin) : [...current, cabin]))
  }

  const toggleScene = (scene: DiscountScene) => {
    setScenes((current) => (current.includes(scene) ? current.filter((item) => item !== scene) : [...current, scene]))
  }

  const toggleAllCurrentCabins = () => {
    const allSelected = currentCabins.every((item) => selectedCabins.includes(item))
    setSelectedCabins((current) =>
      allSelected ? current.filter((item) => !currentCabins.includes(item)) : Array.from(new Set([...current, ...currentCabins])),
    )
  }

  const channelRuleValid =
    type !== '渠道优惠'
      ? true
      : channelMode === '满减优惠'
        ? channelThreshold > 0 && channelReduction > 0
        : escortTeamMin > 0 && escortTeamMax >= escortTeamMin

  const isValid =
    name.trim() &&
    stock > 0 &&
    scenes.length > 0 &&
    selectedSailings.length > 0 &&
    selectedCabins.length > 0 &&
    (type === '渠道优惠' ? channelRuleValid : discountValue > 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4">
      <div className="mx-auto flex h-full max-w-[1500px] flex-col overflow-hidden bg-white shadow-2xl">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-6">
          <h3 className="text-lg font-semibold text-gray-900">{initialRule ? '编辑优惠规则' : '新增优惠规则'}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          <section>
            <h4 className="mb-5 font-semibold text-gray-900">优惠规则</h4>
            <div className="mx-auto grid max-w-4xl grid-cols-[120px_1fr_120px_1fr] items-center gap-x-4 gap-y-4">
              <FormLabel required>规则名称</FormLabel>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入优惠规则名称" className={`${inputClass} w-full`} />
              <FormLabel required>优惠类型</FormLabel>
              <select value={type} onChange={(event) => setType(event.target.value as DiscountType)} className={`${inputClass} w-full`}>
                <option>立减优惠</option>
                <option>年龄优惠</option>
                <option>限时优惠</option>
                <option>折扣优惠</option>
                <option>渠道优惠</option>
              </select>

              {type === '年龄优惠' && (
                <>
                  <FormLabel required>适用年龄</FormLabel>
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue={60} className={`${inputClass} w-24`} />
                    <span className="text-sm text-gray-500">至</span>
                    <input type="number" defaultValue={80} className={`${inputClass} w-24`} />
                    <span className="text-sm text-gray-500">周岁</span>
                  </div>
                </>
              )}
              {type === '限时优惠' && (
                <>
                  <FormLabel required>下单时段</FormLabel>
                  <div className="flex items-center gap-2">
                    <input type="date" defaultValue="2026-07-01" className={`${inputClass} flex-1`} />
                    <span className="text-gray-400">—</span>
                    <input type="date" defaultValue="2026-07-15" className={`${inputClass} flex-1`} />
                  </div>
                </>
              )}

              {type === '渠道优惠' ? (
                <>
                  <FormLabel required>渠道规则</FormLabel>
                  <select value={channelMode} onChange={(event) => setChannelMode(event.target.value as ChannelDiscountMode)} className={`${inputClass} w-full`}>
                    <option>满减优惠</option>
                    <option>团队全陪票</option>
                  </select>

                  {channelMode === '满减优惠' ? (
                    <>
                      <FormLabel required>满减门槛</FormLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">满</span>
                        <input
                          type="number"
                          min={1}
                          value={channelThreshold}
                          onChange={(event) => setChannelThreshold(Number(event.target.value))}
                          className={`${inputClass} w-40`}
                        />
                        <span className="text-sm text-gray-600">元</span>
                      </div>
                      <FormLabel required>优惠金额</FormLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">减</span>
                        <input
                          type="number"
                          min={1}
                          value={channelReduction}
                          onChange={(event) => setChannelReduction(Number(event.target.value))}
                          className={`${inputClass} w-40`}
                        />
                        <span className="text-sm text-gray-600">元</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <FormLabel required>团队人数</FormLabel>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={escortTeamMin}
                          onChange={(event) => setEscortTeamMin(Number(event.target.value))}
                          className={`${inputClass} w-24`}
                        />
                        <span className="text-sm text-gray-500">-</span>
                        <input
                          type="number"
                          min={escortTeamMin}
                          value={escortTeamMax}
                          onChange={(event) => setEscortTeamMax(Number(event.target.value))}
                          className={`${inputClass} w-24`}
                        />
                        <span className="text-sm text-gray-600">人</span>
                      </div>
                      <FormLabel>优惠说明</FormLabel>
                      <div className="text-sm text-gray-600">满足人数区间后，可减 1 张全陪票</div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <FormLabel required>{discountUnit === '折' ? '优惠折扣' : '卖价优惠'}</FormLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={discountUnit === '折' ? 0.1 : 1}
                      max={discountUnit === '折' ? 9.9 : undefined}
                      step={discountUnit === '折' ? 0.1 : 1}
                      value={discountValue}
                      onChange={(event) => setDiscountValue(Number(event.target.value))}
                      className={`${inputClass} w-40`}
                    />
                    <span className="text-sm text-gray-600">{discountUnit}</span>
                  </div>
                  <FormLabel>结算价降低</FormLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settlementReduction}
                      disabled={type === '折扣优惠'}
                      onChange={(event) => setSettlementReduction(Number(event.target.value))}
                      className={`${inputClass} w-40 disabled:bg-gray-100 disabled:text-gray-400`}
                    />
                    <span className="text-sm text-gray-600">元</span>
                  </div>
                </>
              )}

              <FormLabel required>优惠库存</FormLabel>
              <div className="flex items-center gap-2">
                <input type="number" value={stock} onChange={(event) => setStock(Number(event.target.value))} className={`${inputClass} w-40`} />
                <span className="text-sm text-gray-600">份</span>
              </div>
              <FormLabel required>适用场景</FormLabel>
              <div className="flex items-center gap-5">
                {(['2B', '2C'] as const).map((scene) => (
                  <label key={scene} className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={scenes.includes(scene)} onChange={() => toggleScene(scene)} className="accent-blue-600" />
                    {scene}
                  </label>
                ))}
              </div>
              <FormLabel>叠加规则</FormLabel>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="accent-blue-600" />
                允许与其他优惠类型叠加
              </label>
            </div>
          </section>

          <section className="mt-8 border-t border-gray-200 pt-6">
            <div className="mb-5 flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">适用舱房</h4>
              <span className="text-sm text-gray-500">
                已选 {selectedSailings.length} 个班期 · {selectedCabins.length} 个房型
              </span>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-[320px_320px]">
              <label className="space-y-2">
                <span className="block text-sm text-gray-600">产品筛选</span>
                <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)} className={`${inputClass} w-full`}>
                  {productOptions.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm text-gray-600">航线筛选</span>
                <select value={routeFilter} onChange={(event) => setRouteFilter(event.target.value)} className={`${inputClass} w-full`}>
                  {routeOptions.map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-3 overflow-hidden border-b border-gray-200 pb-1">
              <span className="shrink-0 text-sm text-gray-500">邮轮班期：</span>
              <ChevronLeft className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
                {availableSailings.map((date) => (
                  <button
                    key={date}
                    onClick={() => {
                      setActiveSailing(date)
                      setSelectedSailings((current) => (current.includes(date) ? current : [...current, date]))
                    }}
                    className={`shrink-0 border-b-4 px-3 pb-3 pt-2 text-sm ${
                      activeSailing === date ? 'border-blue-500 font-medium text-blue-600' : 'border-transparent text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {date}
                  </button>
                ))}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
              <button onClick={() => setSelectedSailings(availableSailings)} className="shrink-0 text-sm text-blue-600 hover:text-blue-700">
                全部班期
              </button>
            </div>

            <div className="mt-4 flex border-b border-gray-200">
              {(['阳台房', '套房'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCabinTab(tab)}
                  className={`border border-b-0 px-5 py-2 text-sm ${
                    cabinTab === tab ? 'border-gray-300 bg-white font-medium text-blue-600' : 'border-transparent bg-gray-50 text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 border-b border-gray-100 py-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={currentCabins.length > 0 && currentCabins.every((item) => selectedCabins.includes(item))}
                onChange={toggleAllCurrentCabins}
                className="accent-blue-600"
              />
              全选当前分类
            </label>
            <div className="grid grid-cols-3 gap-x-8 gap-y-5 py-5">
              {currentCabins.map((cabin) => (
                <label key={cabin} className="flex min-w-0 cursor-pointer items-start gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedCabins.includes(cabin)}
                    onChange={() => toggleCabin(cabin)}
                    className="mt-0.5 shrink-0 accent-blue-600"
                  />
                  <span className="leading-5">{cabin}</span>
                </label>
              ))}
            </div>
            {currentCabins.length === 0 && <div className="py-10 text-center text-sm text-gray-400">当前筛选条件下暂无可配置舱房</div>}
          </section>
        </div>

        <footer className="flex h-16 shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-white px-6">
          <button onClick={onClose} className="rounded border border-gray-300 bg-white px-5 py-2 text-sm text-gray-700 hover:bg-gray-50">
            取消
          </button>
          <button
            onClick={() =>
              onSave({
                name: name.trim(),
                type,
                discountValue: type === '渠道优惠' ? (channelMode === '满减优惠' ? channelReduction : 0) : discountValue,
                discountUnit,
                settlementReduction: type === '折扣优惠' || type === '渠道优惠' ? 0 : settlementReduction,
                stock,
                scenes,
                channelMode: type === '渠道优惠' ? channelMode : undefined,
                channelThreshold: type === '渠道优惠' && channelMode === '满减优惠' ? channelThreshold : undefined,
                channelReduction: type === '渠道优惠' && channelMode === '满减优惠' ? channelReduction : undefined,
                escortTeamMin: type === '渠道优惠' && channelMode === '团队全陪票' ? escortTeamMin : undefined,
                escortTeamMax: type === '渠道优惠' && channelMode === '团队全陪票' ? escortTeamMax : undefined,
                sailingCount: selectedSailings.length,
                cabinCount: selectedCabins.length,
                validPeriod: `${selectedSailings[0]} 至 ${selectedSailings[selectedSailings.length - 1]}`,
                status: initialRule?.status ?? '启用',
              })
            }
            disabled={!isValid}
            className="rounded bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            保存
          </button>
        </footer>
      </div>
    </div>
  )
}

function FormLabel({ required, children }: { required?: boolean; children: React.ReactNode }) {
  return (
    <label className="text-right text-sm text-gray-700">
      {required && <span className="mr-1 text-red-500">*</span>}
      {children}
    </label>
  )
}
