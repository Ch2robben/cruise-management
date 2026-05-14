import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight, X, Check, Upload } from 'lucide-react'
import { shipApi } from '@/mock/api'
import type { Ship, ShipForm, Deck, DeckFacility, PaginatedResult, SearchParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import { generateId } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

// ========== 常量 ==========
const shipClasses = ['豪华游轮', '高级游轮', '标准游轮']
const starLevels = ['五星级', '四星级', '三星级']
const facilityOptions = ['餐厅', '咖啡厅', '酒吧', '健身房', 'SPA中心', '游泳池', '棋牌室', '电影院', 'KTV', '商店', '医务室', '儿童乐园', '洗衣房']
const facilityHoursOptions = ['24小时', '06:00-22:00', '07:00-21:00', '08:00-20:00', '09:00-21:00', '10:00-22:00', '18:00-02:00']

const STEP_LABELS = ['基本信息', '甲板信息', '舱房管理']

const emptyForm: ShipForm = {
  name: '', nameEn: '', code: '', series: '', realNameId: '',
  shipClass: '', starLevel: '', capacity: 0, floors: 0,
  length: 0, width: 0, depth: 0, speed: 0,
  voltage: 220, acSystem: '', factoryDate: '', lastRenovation: '',
  maidenVoyage: '', renovationContent: '', contact: '', contactPhone: '',
  decks: [],
}

function emptyFacility(): Omit<DeckFacility, 'id'> {
  return { name: '', hours: '', enabled: true }
}

function emptyDeck(floorNum: number): ShipForm['decks'][number] {
  return {
    floorNum,
    name: '', nameEn: '', area: 0, image: '', remark: '',
    facilities: [emptyFacility()], cabins: [],
  }
}

export default function ShipPage() {
  // 列表状态
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Ship>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')

  // 表单状态
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ShipForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  // 详情 / 确认
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Ship | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    const result = await shipApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => fetchData(1)
  const handleReset = () => setKeyword('')

  // ========== 表单操作 ==========
  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setStep(0)
    setFormOpen(true)
  }

  const openEdit = (record: Ship) => {
    setEditingId(record.id)
    setForm({
      name: record.name, nameEn: record.nameEn, code: record.code,
      series: record.series, realNameId: record.realNameId,
      shipClass: record.shipClass, starLevel: record.starLevel,
      capacity: record.capacity, floors: record.floors,
      length: record.length, width: record.width, depth: record.depth, speed: record.speed,
      voltage: record.voltage, acSystem: record.acSystem,
      factoryDate: record.factoryDate, lastRenovation: record.lastRenovation,
      maidenVoyage: record.maidenVoyage, renovationContent: record.renovationContent,
      contact: record.contact, contactPhone: record.contactPhone,
      decks: record.decks.map((d) => ({
        floorNum: d.floorNum, name: d.name, nameEn: d.nameEn,
        area: d.area, image: d.image, remark: d.remark,
        facilities: d.facilities.map((f) => ({ name: f.name, hours: f.hours, enabled: f.enabled })),
        cabins: d.cabins.map((c) => ({ name: c.name, nameEn: c.nameEn, image: c.image, cabinCount: c.cabinCount, bedCount: c.bedCount, extraBed: c.extraBed, capacity: c.capacity, area: c.area, balconyArea: c.balconyArea, premiumDiff: c.premiumDiff, floorFee: c.floorFee, height: c.height, description: c.description, sort: c.sort, sellByRoom: c.sellByRoom, mergeTourPlan: c.mergeTourPlan })),
      })),
    })
    setStep(0)
    setFormOpen(true)
  }

  const openDetail = async (record: Ship) => {
    const r = await shipApi.getById(record.id)
    setDetail(r || null)
    setDetailOpen(true)
  }

  // 步骤校验
  const canNext = (): boolean => {
    if (step === 0) return !!form.name.trim() && !!form.nameEn.trim() && !!form.code.trim() && !!form.shipClass && !!form.starLevel && form.capacity > 0 && form.floors > 0 && !!form.factoryDate.trim()
    return true
  }

  const nextStep = () => {
    if (!canNext()) return
    if (step === 1 && form.floors > 0) autoInitDecks()
    setStep((s) => Math.min(s + 1, 2))
  }

  const autoInitDecks = () => {
    const current = form.decks || []
    if (current.length === form.floors) return // 已匹配，不重置
    const decks: ShipForm['decks'] = []
    for (let i = 1; i <= form.floors; i++) {
      const existing = current.find((d) => d.floorNum === i)
      if (existing) {
        decks.push(existing)
      } else {
        decks.push(emptyDeck(i))
      }
    }
    setForm((f) => ({ ...f, decks }))
  }

  // Deck 字段更新
  const updateDeck = (idx: number, field: keyof Omit<Deck, 'id' | 'facilities'>, value: string | number) => {
    setForm((f) => {
      const decks = [...(f.decks || [])]
      decks[idx] = { ...decks[idx], [field]: value }
      return { ...f, decks }
    })
  }

  // Deck 设施操作
  const updateFacility = (deckIdx: number, facIdx: number, field: keyof DeckFacility, value: string | number | boolean) => {
    setForm((f) => {
      const decks = [...(f.decks || [])]
      const facilities = [...decks[deckIdx].facilities]
      facilities[facIdx] = { ...facilities[facIdx], [field]: value }
      decks[deckIdx] = { ...decks[deckIdx], facilities }
      return { ...f, decks }
    })
  }

  const addFacility = (deckIdx: number) => {
    setForm((f) => {
      const decks = [...(f.decks || [])]
      decks[deckIdx] = {
        ...decks[deckIdx],
        facilities: [...decks[deckIdx].facilities, emptyFacility()],
      }
      return { ...f, decks }
    })
  }

  const removeFacility = (deckIdx: number, facIdx: number) => {
    setForm((f) => {
      const decks = [...(f.decks || [])]
      decks[deckIdx] = {
        ...decks[deckIdx],
        facilities: decks[deckIdx].facilities.filter((_, i) => i !== facIdx),
      }
      return { ...f, decks }
    })
  }

  // Cabin helpers (step 3)
  const updateCabin = (deckIdx: number, cabIdx: number, field: string, value: string | number | boolean) => {
    setForm((f) => {
      const decks = [...(f.decks || [])]
      const cabins = [...decks[deckIdx].cabins]
      cabins[cabIdx] = { ...cabins[cabIdx], [field]: value }
      decks[deckIdx] = { ...decks[deckIdx], cabins }
      return { ...f, decks }
    })
  }
  const addCabin = (deckIdx: number) => {
    setForm((f) => {
      const decks = [...(f.decks || [])]
      decks[deckIdx] = { ...decks[deckIdx], cabins: [...decks[deckIdx].cabins, {
        name: '', nameEn: '', image: '', cabinCount: 0, bedCount: 0, extraBed: 0,
        capacity: 0, area: 0, balconyArea: 0, premiumDiff: 0, floorFee: 0, height: 0,
        description: '', sort: 0, sellByRoom: false, mergeTourPlan: false,
      }]}
      return { ...f, decks }
    })
  }
  const removeCabin = (deckIdx: number, cabIdx: number) => {
    setForm((f) => {
      const decks = [...(f.decks || [])]
      decks[deckIdx] = { ...decks[deckIdx], cabins: decks[deckIdx].cabins.filter((_, i) => i !== cabIdx) }
      return { ...f, decks }
    })
  }

  const handleSubmit = async () => {
    if (!canNext()) return
    setFormLoading(true)
    const now = new Date().toISOString()
    // 计算总船舱数
    const cabinCount = form.decks.reduce((sum, d) => sum + d.facilities.length * 20, 0)
    // 根据星级推断 level（兼容产品模块）
    const level = form.starLevel

    const shipData = {
      ...form,
      cabinCount,
      level,
      cabinTypes: ['suite', 'balcony', 'window', 'inside'],
      decks: form.decks.map((d) => ({
        ...d,
        id: generateId(),
        facilities: d.facilities.map((f) => ({ ...f, id: generateId() })),
      })),
      status: 'enabled' as const,
      updatedBy: '当前用户',
      updatedAt: now,
      createdAt: editingId ? undefined : now,
    }

    if (editingId) {
      await shipApi.update(editingId, shipData as Partial<Ship>)
    } else {
      const { createdAt, ...rest } = shipData
      await shipApi.create({ ...rest, createdAt: createdAt! } as Omit<Ship, 'id'>)
    }
    setFormLoading(false)
    setFormOpen(false)
    fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => {
    await shipApi.toggleStatus(id)
    fetchData(data.page)
  }

  const handleDelete = (id: string) => {
    setConfirmId(id)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    await shipApi.remove(confirmId)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  // ========== 表格列 ==========
  const columns = [
    { key: 'index', title: '序号', render: (_: Ship, idx: number) => (
      <span className="text-gray-400">{(data.page - 1) * data.pageSize + idx + 1}</span>
    )},
    { key: 'code', title: '游轮代码', render: (r: Ship) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '游轮名称', dataIndex: 'name' as keyof Ship },
    { key: 'series', title: '游轮系列', dataIndex: 'series' as keyof Ship },
    { key: 'shipClass', title: '船级', dataIndex: 'shipClass' as keyof Ship },
    { key: 'starLevel', title: '星级', render: (r: Ship) => (
      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
        r.starLevel === '五星级' ? 'bg-amber-50 text-amber-700' :
        r.starLevel === '四星级' ? 'bg-blue-50 text-blue-700' :
        'bg-gray-100 text-gray-600'
      }`}>{r.starLevel}</span>
    )},
    { key: 'capacity', title: '载客量', render: (r: Ship) => `${r.capacity}人` },
    { key: 'cabinCount', title: '船舱数量', render: (r: Ship) => `${r.cabinCount}间` },
    { key: 'floors', title: '层数', render: (r: Ship) => `${r.floors}层` },
    { key: 'length', title: '长度', render: (r: Ship) => `${r.length}m` },
    { key: 'width', title: '型宽', render: (r: Ship) => `${r.width}m` },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof Ship },
    { key: 'updatedAt', title: '修改时间', render: (r: Ship) => formatDateTime(r.updatedAt) },
    { key: 'status', title: '状态', render: (r: Ship) => <StatusBadge status={r.status} /> },
    { key: 'actions', title: '操作', width: '180px', render: (r: Ship) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
          {r.status === 'enabled' ? '禁用' : '启用'}
        </button>
        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded">删除</button>
      </div>
    )},
  ]

  // ========== 渲染 Step 内容 ==========
  const renderStep0 = () => (
    <div className="space-y-5">
      <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基础标识信息</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-gray-700 mb-1">游轮名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm text-gray-700 mb-1">英文名称 <span className="text-red-500">*</span></label><input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm text-gray-700 mb-1">游轮代码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
          <div><label className="block text-sm text-gray-700 mb-1">实名制ID <span className="text-red-500">*</span></label><input value={form.realNameId} onChange={(e) => setForm({ ...form, realNameId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
          <div><label className="block text-sm text-gray-700 mb-1">游轮系列</label><input value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm text-gray-700 mb-1">船级 <span className="text-red-500">*</span></label><select value={form.shipClass} onChange={(e) => setForm({ ...form, shipClass: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">请选择</option>{shipClasses.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="block text-sm text-gray-700 mb-1">星级 <span className="text-red-500">*</span></label><select value={form.starLevel} onChange={(e) => setForm({ ...form, starLevel: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">请选择</option>{starLevels.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
        </div>
      </div>
      <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">物理规格信息</h4>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-xs text-gray-500 mb-0.5">核载客数 <span className="text-red-500">*</span></label><input type="number" value={form.capacity || ''} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-0.5">层数 <span className="text-red-500">*</span></label><input type="number" value={form.floors || ''} onChange={(e) => setForm({ ...form, floors: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-0.5">长度(m)</label><input type="number" value={form.length || ''} onChange={(e) => setForm({ ...form, length: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-0.5">型宽(m)</label><input type="number" value={form.width || ''} onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-0.5">型深(m)</label><input type="number" value={form.depth || ''} onChange={(e) => setForm({ ...form, depth: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-0.5">静水航速(km/h)</label><input type="number" value={form.speed || ''} onChange={(e) => setForm({ ...form, speed: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
        </div>
      </div>
      <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">设施与工程信息</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500 mb-0.5">电压(V)</label><input type="number" value={form.voltage || ''} onChange={(e) => setForm({ ...form, voltage: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-0.5">空调系统</label><input value={form.acSystem} onChange={(e) => setForm({ ...form, acSystem: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-0.5">出厂日期 <span className="text-red-500">*</span></label><input type="date" value={form.factoryDate} onChange={(e) => setForm({ ...form, factoryDate: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-0.5">末次装修</label><input type="date" value={form.lastRenovation} onChange={(e) => setForm({ ...form, lastRenovation: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-0.5">首航日期</label><input type="date" value={form.maidenVoyage} onChange={(e) => setForm({ ...form, maidenVoyage: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-0.5">装修内容</label><textarea value={form.renovationContent} onChange={(e) => setForm({ ...form, renovationContent: e.target.value })} rows={2} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm resize-none" /></div>
        </div>
      </div>
      <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">联系人信息</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500 mb-0.5">联系人</label><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-0.5">联系人电话</label><input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
        </div>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">甲板信息（共 {form.floors} 层）</h4>
        <span className="text-xs text-gray-400">层数由 Step2 确定，修改后需返回 Step2 调整</span>
      </div>
      {(form.decks || []).map((deck, dIdx) => {
        const facilityCount = deck.facilities.length
        return (
          <div key={dIdx} className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-14">层数</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">甲板名称</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">英文名称</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-20">面积(㎡)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-20">图片</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">备注</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">设施名称</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-32">营业时间</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 w-14">启用</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 w-14">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deck.facilities.length === 0 ? (
                  <tr>
                    <td className="px-3 py-2.5 text-gray-700 font-medium">{deck.floorNum}层</td>
                    <td className="px-3 py-2.5">
                      <input value={deck.name} onChange={(e) => updateDeck(dIdx, 'name', e.target.value)} placeholder="甲板名称"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                    </td>
                    <td className="px-3 py-2.5">
                      <input value={deck.nameEn} onChange={(e) => updateDeck(dIdx, 'nameEn', e.target.value)} placeholder="英文名称"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                    </td>
                    <td className="px-3 py-2.5">
                      <input type="number" value={deck.area || ''} onChange={(e) => updateDeck(dIdx, 'area', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                    </td>
                    <td className="px-3 py-2.5">
                      <button type="button" onClick={() => { const u = prompt('图片URL:'); if (u) updateDeck(dIdx, 'image', u) }}
                        className="px-2 py-1 text-xs border border-dashed border-gray-300 rounded text-gray-400 hover:text-gray-600 hover:border-gray-500">
                        <Upload className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <input value={deck.remark} onChange={(e) => updateDeck(dIdx, 'remark', e.target.value)} placeholder="备注"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                    </td>
                    <td colSpan={3} className="px-3 py-2.5 text-center text-gray-400 text-xs">暂无设施</td>
                    <td className="px-3 py-2.5 text-center">
                      <button type="button" onClick={() => addFacility(dIdx)}
                        className="px-2 py-0.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded">+ 新增</button>
                    </td>
                  </tr>
                ) : (
                  deck.facilities.map((fac, fIdx) => (
                    <tr key={fIdx}>
                      {/* Deck 跨行字段：仅首行渲染 + rowSpan */}
                      {fIdx === 0 && (
                        <>
                          <td className="px-3 py-2 text-gray-700 font-medium bg-gray-50/50" rowSpan={facilityCount}>{deck.floorNum}层</td>
                          <td className="px-3 py-2 bg-gray-50/50" rowSpan={facilityCount}>
                            <input value={deck.name} onChange={(e) => updateDeck(dIdx, 'name', e.target.value)} placeholder="甲板名称"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                          </td>
                          <td className="px-3 py-2 bg-gray-50/50" rowSpan={facilityCount}>
                            <input value={deck.nameEn} onChange={(e) => updateDeck(dIdx, 'nameEn', e.target.value)} placeholder="英文名称"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                          </td>
                          <td className="px-3 py-2 bg-gray-50/50" rowSpan={facilityCount}>
                            <input type="number" value={deck.area || ''} onChange={(e) => updateDeck(dIdx, 'area', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                          </td>
                          <td className="px-3 py-2 bg-gray-50/50" rowSpan={facilityCount}>
                            <button type="button" onClick={() => { const u = prompt('图片URL:'); if (u) updateDeck(dIdx, 'image', u) }}
                              className="px-2 py-1 text-xs border border-dashed border-gray-300 rounded text-gray-400 hover:text-gray-600 hover:border-gray-500">
                              <Upload className="w-3 h-3" />
                            </button>
                            {deck.image && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[80px]">已上传</p>}
                          </td>
                          <td className="px-3 py-2 bg-gray-50/50" rowSpan={facilityCount}>
                            <input value={deck.remark} onChange={(e) => updateDeck(dIdx, 'remark', e.target.value)} placeholder="备注"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                          </td>
                        </>
                      )}
                      {/* 设施不跨行字段 */}
                      <td className="px-3 py-2">
                        <select value={fac.name} onChange={(e) => updateFacility(dIdx, fIdx, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                          <option value="">选择设施</option>
                          {facilityOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={fac.hours} onChange={(e) => updateFacility(dIdx, fIdx, 'hours', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                          <option value="">选择</option>
                          {facilityHoursOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={fac.enabled} onChange={(e) => updateFacility(dIdx, fIdx, 'enabled', e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => removeFacility(dIdx, fIdx)}
                          className="px-2 py-0.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded">删除</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* 新增设施按钮 */}
            {deck.facilities.length > 0 && (
              <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/30">
                <button type="button" onClick={() => addFacility(dIdx)}
                  className="px-2 py-0.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded">+ 新增设施</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">舱房管理</h4>
        <span className="text-xs text-gray-400">按甲板分组管理船舱配置</span>
      </div>
      {(form.decks || []).map((deck, dIdx) => (
        <div key={dIdx} className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-2 py-1.5 text-left text-gray-600 w-14">层数</th><th className="px-2 py-1.5 text-left text-gray-600">甲板名称</th>
              <th className="px-2 py-1.5 text-left text-gray-600">船舱名称</th><th className="px-2 py-1.5 text-left text-gray-600">英文</th><th className="px-2 py-1.5 text-left text-gray-600 w-16">数量</th>
              <th className="px-2 py-1.5 text-left text-gray-600 w-14">床位</th><th className="px-2 py-1.5 text-left text-gray-600 w-14">客容</th><th className="px-2 py-1.5 text-left text-gray-600 w-16">面积</th>
              <th className="px-2 py-1.5 text-left text-gray-600 w-14">排序</th><th className="px-2 py-1.5 text-center text-gray-600 w-12">按间</th>
              <th className="px-2 py-1.5 text-center text-gray-600 w-14">操作</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {deck.cabins.length === 0 ? (
                <tr><td className="px-2 py-2 text-gray-700 font-medium">{deck.floorNum}层</td><td className="px-2 py-2 text-gray-700">{deck.name}</td><td colSpan={8} className="px-2 py-2 text-center text-gray-400">暂无舱房</td>
                  <td className="px-2 py-2 text-center"><button type="button" onClick={() => addCabin(dIdx)} className="text-xs text-blue-600 hover:bg-blue-50 rounded px-1 py-0.5">+ 新增</button></td></tr>
              ) : deck.cabins.map((cab, cIdx) => (
                <tr key={cIdx}>
                  {cIdx === 0 && <><td className="px-2 py-2 text-gray-700 font-medium bg-gray-50/50" rowSpan={deck.cabins.length}>{deck.floorNum}层</td><td className="px-2 py-2 text-gray-700 bg-gray-50/50" rowSpan={deck.cabins.length}>{deck.name}</td></>}
                  <td className="px-2 py-2"><input value={cab.name} onChange={(e) => updateCabin(dIdx, cIdx, 'name', e.target.value)} className="w-full px-1 py-1 border border-gray-300 rounded text-xs" placeholder="名称" /></td>
                  <td className="px-2 py-2"><input value={cab.nameEn} onChange={(e) => updateCabin(dIdx, cIdx, 'nameEn', e.target.value)} className="w-full px-1 py-1 border border-gray-300 rounded text-xs" placeholder="英文" /></td>
                  <td className="px-2 py-2"><input type="number" value={cab.cabinCount || ''} onChange={(e) => updateCabin(dIdx, cIdx, 'cabinCount', Number(e.target.value))} className="w-full px-1 py-1 border border-gray-300 rounded text-xs" /></td>
                  <td className="px-2 py-2"><input type="number" value={cab.bedCount || ''} onChange={(e) => updateCabin(dIdx, cIdx, 'bedCount', Number(e.target.value))} className="w-full px-1 py-1 border border-gray-300 rounded text-xs" /></td>
                  <td className="px-2 py-2"><input type="number" value={cab.capacity || ''} onChange={(e) => updateCabin(dIdx, cIdx, 'capacity', Number(e.target.value))} className="w-full px-1 py-1 border border-gray-300 rounded text-xs" /></td>
                  <td className="px-2 py-2"><input type="number" value={cab.area || ''} onChange={(e) => updateCabin(dIdx, cIdx, 'area', Number(e.target.value))} className="w-full px-1 py-1 border border-gray-300 rounded text-xs" /></td>
                  <td className="px-2 py-2"><input type="number" value={cab.sort || ''} onChange={(e) => updateCabin(dIdx, cIdx, 'sort', Number(e.target.value))} className="w-full px-1 py-1 border border-gray-300 rounded text-xs" /></td>
                  <td className="px-2 py-2 text-center"><input type="checkbox" checked={cab.sellByRoom} onChange={(e) => updateCabin(dIdx, cIdx, 'sellByRoom', e.target.checked)} className="w-3 h-3 rounded border-gray-300 cursor-pointer" /></td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center gap-0.5 justify-center">
                      <button type="button" onClick={() => addCabin(dIdx)} className="text-xs text-blue-500 hover:bg-blue-50 rounded px-1 py-0.5">+</button>
                      <button type="button" onClick={() => removeCabin(dIdx, cIdx)} className="text-xs text-red-400 hover:bg-red-50 rounded px-1 py-0.5">×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )

  const renderStepContent = () => {
    switch (step) {
      case 0: return renderStep0()
      case 1: return renderStep1()
      case 2: return renderStep2()
      default: return null
    }
  }

  return (
    <div>
      <PageHeader title="游轮管理" description="管理执航游轮的基础信息、物理规格、设施配置与甲板规划">
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
          <Plus className="w-4 h-4" />新增游轮
        </button>
      </PageHeader>

      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="游轮名称/代码"
            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
        </div>
      </SearchPanel>

      {/* 自定义表格（支持序号列） */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                    style={col.width ? { width: col.width } : undefined}>{col.title}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
              ) : (
                data.data.map((record, idx) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">
                        {col.render ? col.render(record, idx) : col.dataIndex ? String(record[col.dataIndex as keyof Ship] ?? '-') : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">共 {data.total} 条，第 {data.page}/{Math.ceil(data.total / data.pageSize)} 页</span>
            <div className="flex items-center gap-1">
              <button onClick={() => fetchData(data.page - 1)} disabled={data.page <= 1}
                className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">上一页</button>
              <button onClick={() => fetchData(data.page + 1)} disabled={data.page >= Math.ceil(data.total / data.pageSize)}
                className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">下一页</button>
            </div>
          </div>
        )}
      </div>

      {/* 分步表单弹窗 */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFormOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[88vh] flex flex-col">
            {/* 标题 */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 shrink-0">
              <h3 className="text-base font-semibold text-gray-900">{editingId ? '编辑游轮' : '新增游轮'}</h3>
              <button onClick={() => setFormOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button>
            </div>

            {/* 步骤条 */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200 shrink-0 bg-gray-50/50">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex items-center">
                  <div className={`flex items-center gap-1.5 ${i <= step ? '' : 'opacity-40'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      i < step ? 'bg-gray-900 text-white' : i === step ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {i < step ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`w-8 h-px mx-2 ${i < step ? 'bg-gray-900' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* 步骤内容 */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {renderStepContent()}
            </div>

            {/* 底部操作 */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 shrink-0">
              <button onClick={() => setFormOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">取消</button>
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button onClick={() => setStep((s) => s - 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <ChevronLeft className="w-4 h-4" />上一步
                  </button>
                )}
                {step < 2 ? (
                  <button onClick={nextStep} disabled={!canNext()}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40">
                    下一步<ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={formLoading}
                    className="px-6 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
                    {formLoading ? '提交中...' : '提交'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 详情抽屉 */}
      <DetailDrawer open={detailOpen} title="游轮详情" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基础标识">
              <DetailRow label="游轮名称" value={detail.name} />
              <DetailRow label="英文名称" value={detail.nameEn} />
              <DetailRow label="游轮代码" value={detail.code} mono />
              <DetailRow label="实名制ID" value={detail.realNameId} mono />
              <DetailRow label="游轮系列" value={detail.series || '-'} />
              <DetailRow label="船级" value={detail.shipClass} />
              <DetailRow label="星级" value={detail.starLevel} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>
            <DetailCard title="物理规格">
              <DetailRow label="核载客数" value={`${detail.capacity}人`} />
              <DetailRow label="层数" value={`${detail.floors}层`} />
              <DetailRow label="长度" value={`${detail.length}m`} />
              <DetailRow label="型宽" value={`${detail.width}m`} />
              <DetailRow label="型深" value={`${detail.depth}m`} />
              <DetailRow label="静水航速" value={`${detail.speed}km/h`} />
              <DetailRow label="船舱数量" value={`${detail.cabinCount}间`} />
            </DetailCard>
            <DetailCard title="设施与工程">
              <DetailRow label="电压" value={`${detail.voltage}V`} />
              <DetailRow label="空调系统" value={detail.acSystem || '-'} />
              <DetailRow label="出厂日期" value={detail.factoryDate || '-'} />
              <DetailRow label="末次装修" value={detail.lastRenovation || '-'} />
              <DetailRow label="首航日期" value={detail.maidenVoyage || '-'} />
              <DetailRow label="装修内容" value={detail.renovationContent || '-'} />
            </DetailCard>
            <DetailCard title="联系人">
              <DetailRow label="联系人" value={detail.contact || '-'} />
              <DetailRow label="联系电话" value={detail.contactPhone || '-'} />
            </DetailCard>
            <DetailCard title={`甲板信息（${detail.decks.length}层）`}>
              {detail.decks.map((deck) => (
                <div key={deck.id} className="mb-3 last:mb-0 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                    {deck.floorNum}层 - {deck.name} / {deck.nameEn}
                    {deck.area > 0 && <span className="ml-2 text-gray-500">面积 {deck.area}㎡</span>}
                  </div>
                  {deck.facilities.length > 0 && (
                    <div className="px-3 py-2 flex flex-wrap gap-1.5">
                      {deck.facilities.map((f) => (
                        <span key={f.id} className={`px-2 py-0.5 rounded text-xs ${f.enabled ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                          {f.name} {f.hours}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </DetailCard>
            <DetailCard title="操作信息">
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除游轮"
        message="确定要删除该游轮吗？此操作不可恢复，关联的产品和甲板数据将被一并删除。"
        danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
