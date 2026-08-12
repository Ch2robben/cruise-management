import { useState } from 'react'
import { Plus, Check, X } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import ConfirmDialog from '@/components/common/ConfirmDialog'

// ======================== Mock 数据 ========================

const GROUPS_DIST = [
  { id: 'g1', name: '重庆地区' },
  { id: 'g2', name: '湖北地区' },
  { id: 'g3', name: 'OTA渠道' },
]

const PRODUCTS = ['长江三峡5日游', '黄金水道4日游', '三峡人家精华游3日', '长江明珠豪华游轮7日']
const TICKET_TYPES = ['成人票', '儿童票', '老年票', '亲子票']

/** 分销产品与分组关系（不含价格） */
const initDistProducts = [
  { id: 'dp1', groupId: 'g1', groupName: '重庆地区', productName: '长江三峡5日游', enabled: true },
  { id: 'dp2', groupId: 'g1', groupName: '重庆地区', productName: '黄金水道4日游', enabled: true },
  { id: 'dp3', groupId: 'g1', groupName: '重庆地区', productName: '三峡人家精华游3日', enabled: false },
  { id: 'dp4', groupId: 'g2', groupName: '湖北地区', productName: '长江三峡5日游', enabled: true },
  { id: 'dp5', groupId: 'g2', groupName: '湖北地区', productName: '黄金水道4日游', enabled: true },
  { id: 'dp6', groupId: 'g3', groupName: 'OTA渠道', productName: '长江三峡5日游', enabled: true },
  { id: 'dp7', groupId: 'g3', groupName: 'OTA渠道', productName: '长江明珠豪华游轮7日', enabled: true },
]

type DistProductRelation = typeof initDistProducts[number]

const initPolicyTypes = [
  { id: 'pt1', name: '散客预定', minOrder: 0, priority: 1, productCount: 3, status: '启用', createdAt: '2025-01-01' },
  { id: 'pt2', name: '团队预定', minOrder: 10, priority: 2, productCount: 2, status: '启用', createdAt: '2025-01-01' },
  { id: 'pt3', name: '大团队预定', minOrder: 30, priority: 3, productCount: 1, status: '启用', createdAt: '2025-03-15' },
]

const initPricePolicies = [
  { id: 'pp1', name: '国庆特惠政策', productName: '长江三峡5日游', ticketType: '成人票', policyType: '散客预定', groupId: 'g1', groupName: '重庆地区', startDate: '2026-09-29', endDate: '2026-10-08', minOrder: 0, retailPrice: 1580, settlementPrice: 1320, priority: 1, status: '已发布' },
  { id: 'pp2', name: '暑期团队政策', productName: '黄金水道4日游', ticketType: '成人票', policyType: '团队预定', groupId: 'g2', groupName: '湖北地区', startDate: '2026-07-01', endDate: '2026-08-31', minOrder: 15, retailPrice: 1250, settlementPrice: 980, priority: 2, status: '审批中' },
  { id: 'pp3', name: '五一散客专享', productName: '长江三峡5日游', ticketType: '成人票', policyType: '散客预定', groupId: 'g3', groupName: 'OTA渠道', startDate: '2026-04-30', endDate: '2026-05-05', minOrder: 0, retailPrice: 1620, settlementPrice: 1250, priority: 1, status: '已下架' },
]

const initRefundPolicies = [
  { id: 'rp1', name: '常规退改政策', productName: '长江三峡5日游', ticketType: '成人票', groupId: 'g1', groupName: '重庆地区', startDate: '2026-01-01', endDate: '2026-12-31', allowRefund: true, feeRules: '7天前免费；3-7天收10%；3天内收30%；出发后不退', priority: 1, status: '已发布' },
  { id: 'rp2', name: 'OTA渠道特殊退改', productName: '长江三峡5日游', ticketType: '成人票', groupId: 'g3', groupName: 'OTA渠道', startDate: '2026-01-01', endDate: '2026-12-31', allowRefund: true, feeRules: '14天前免费；7-14天收5%；7天内收20%', priority: 2, status: '已发布' },
  { id: 'rp3', name: '团队不退改政策', productName: '黄金水道4日游', ticketType: '成人票', groupId: 'g2', groupName: '湖北地区', startDate: '2026-06-01', endDate: '2026-08-31', allowRefund: false, feeRules: '团队票不可退', priority: 1, status: '审批中' },
]

// ======================== 通用弹窗 ========================

function Modal({ title, onClose, children, width = 'max-w-lg' }: { title: string; onClose: () => void; children: React.ReactNode; width?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`w-full ${width} rounded-xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function FormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2">
      <label className="w-24 shrink-0 pt-2 text-sm text-gray-700 text-right">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const selectCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// ======================== Tab: 分销列表（产品与分组关系） ========================

function TabDistProducts() {
  const [selectedGroup, setSelectedGroup] = useState('g1')
  const [relations, setRelations] = useState(initDistProducts)
  const [showAdd, setShowAdd] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DistProductRelation | null>(null)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const filtered = relations.filter(p => p.groupId === selectedGroup)
  const currentGroup = GROUPS_DIST.find(g => g.id === selectedGroup)
  const availableProducts = PRODUCTS.filter(name => !filtered.some(p => p.productName === name))
  const otherGroups = GROUPS_DIST.filter(g => g.id !== selectedGroup)

  const [addForm, setAddForm] = useState({ productName: PRODUCTS[0], enabled: true })
  const [copySourceId, setCopySourceId] = useState(otherGroups[0]?.id ?? '')

  const openAdd = () => {
    setAddForm({ productName: availableProducts[0] ?? PRODUCTS[0], enabled: true })
    setShowAdd(true)
  }

  return (
    <div className="flex gap-4">
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <div className="w-40 shrink-0 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-3 py-2.5 text-xs font-semibold text-gray-500">分销商分组</div>
        <div className="p-1.5 space-y-0.5">
          {GROUPS_DIST.map(g => (
            <button key={g.id} onClick={() => setSelectedGroup(g.id)} className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm ${selectedGroup === g.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
              <span>{g.name}</span>
              <span className="text-xs text-gray-400">{relations.filter(r => r.groupId === g.id).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className="mb-3 flex items-center gap-2">
          <button onClick={openAdd} disabled={availableProducts.length === 0} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700 disabled:opacity-50"><Plus className="h-4 w-4" />新增产品分销</button>
          <button onClick={() => { setCopySourceId(otherGroups[0]?.id ?? ''); setShowCopy(true) }} className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50">同其他分组配置</button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">产品名称</th>
                <th className="px-4 py-3 text-center font-medium">分销授权</th>
                <th className="px-4 py-3 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-gray-400">该分组暂无分销产品，点击【新增产品分销】添加</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={p.enabled}
                        aria-label={p.enabled ? '关闭分销' : '开启分销'}
                        onClick={() => {
                          setRelations(prev => prev.map(x => x.id === p.id ? { ...x, enabled: !x.enabled } : x))
                          showToast(p.enabled ? '已关闭分销' : '已开启分销')
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${p.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <span className={`mt-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${p.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className={`text-xs ${p.enabled ? 'text-blue-700' : 'text-gray-500'}`}>{p.enabled ? '开启' : '关闭'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setDeleteTarget(p)} className="text-xs text-red-500 hover:text-red-600">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title={`新增产品分销 — ${currentGroup?.name}`} onClose={() => setShowAdd(false)}>
          <div className="space-y-0">
            <FormRow label="产品" required>
              <select value={addForm.productName} onChange={e => setAddForm(f => ({ ...f, productName: e.target.value }))} className={selectCls}>
                {(availableProducts.length > 0 ? availableProducts : PRODUCTS).map(p => <option key={p}>{p}</option>)}
              </select>
            </FormRow>
            <FormRow label="开启状态">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addForm.enabled} onChange={e => setAddForm(f => ({ ...f, enabled: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">立即开启分销</span>
              </label>
            </FormRow>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={() => {
              if (!addForm.productName || filtered.some(p => p.productName === addForm.productName)) {
                showToast('该产品已在当前分组中')
                return
              }
              setRelations(prev => [...prev, {
                id: `dp${Date.now()}`,
                groupId: selectedGroup,
                groupName: currentGroup?.name ?? '',
                productName: addForm.productName,
                enabled: addForm.enabled,
              }])
              setShowAdd(false)
              showToast('已添加分销产品')
            }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">保存</button>
          </div>
        </Modal>
      )}

      {showCopy && (
        <Modal title={`同其他分组配置 — ${currentGroup?.name}`} onClose={() => setShowCopy(false)}>
          <p className="mb-4 text-sm leading-6 text-gray-600">将其他分组的分销产品关系复制到「{currentGroup?.name}」。确认后会覆盖该分组现有产品配置。</p>
          <FormRow label="来源分组" required>
            <select value={copySourceId} onChange={e => setCopySourceId(e.target.value)} className={selectCls}>
              {otherGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </FormRow>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowCopy(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button
              disabled={!copySourceId}
              onClick={() => {
                const source = GROUPS_DIST.find(g => g.id === copySourceId)
                const sourceItems = relations.filter(r => r.groupId === copySourceId)
                setRelations(prev => [
                  ...prev.filter(r => r.groupId !== selectedGroup),
                  ...sourceItems.map((item, index) => ({
                    id: `dp${Date.now()}_${index}`,
                    groupId: selectedGroup,
                    groupName: currentGroup?.name ?? '',
                    productName: item.productName,
                    enabled: item.enabled,
                  })),
                ])
                setShowCopy(false)
                showToast(`已将「${source?.name ?? ''}」的产品配置复制到「${currentGroup?.name ?? ''}」`)
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              确认复制
            </button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除产品分销"
        message={`确定将「${deleteTarget?.productName ?? ''}」从「${currentGroup?.name ?? ''}」移除吗？`}
        danger
        onConfirm={() => {
          if (!deleteTarget) return
          setRelations(prev => prev.filter(x => x.id !== deleteTarget.id))
          setDeleteTarget(null)
          showToast('已移除分销产品')
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ======================== Tab: 价格政策类型 ========================

function TabPolicyTypes() {
  const [types, setTypes] = useState(initPolicyTypes)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', minOrder: '0', priority: '4' })
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  return (
    <div>
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <div className="mb-3">
        <button onClick={() => setShowAdd(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700"><Plus className="h-4 w-4" />新增政策类型</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">政策类型名称</th>
              <th className="px-4 py-3 text-right font-medium">最低起订量</th>
              <th className="px-4 py-3 text-right font-medium">优先级</th>
              <th className="px-4 py-3 text-right font-medium">关联政策数</th>
              <th className="px-4 py-3 text-center font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">创建时间</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {types.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-right text-gray-700">{t.minOrder > 0 ? `${t.minOrder}人` : '无限制'}</td>
                <td className="px-4 py-3 text-right text-gray-700">P{t.priority}</td>
                <td className="px-4 py-3 text-right text-gray-700">{t.productCount}</td>
                <td className="px-4 py-3 text-center"><span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">{t.status}</span></td>
                <td className="px-4 py-3 text-gray-500">{t.createdAt}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <button className="text-blue-600 hover:text-blue-700">编辑</button>
                    <button onClick={() => { if (t.productCount > 0) { showToast('该类型下已有关联政策，不可删除') } else { setTypes(prev => prev.filter(x => x.id !== t.id)); showToast('删除成功') } }} className={`${t.productCount > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-600'}`}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">注：政策类型下已有关联政策时不可删除。</p>

      {showAdd && (
        <Modal title="新增价格政策类型" onClose={() => setShowAdd(false)}>
          <div className="space-y-0">
            <FormRow label="类型名称" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="如：VIP客户预定" /></FormRow>
            <FormRow label="最低起订量"><div className="flex items-center gap-2"><input type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} className={inputCls} /><span className="shrink-0 text-sm text-gray-500">人（0=无限制）</span></div></FormRow>
            <FormRow label="优先级"><input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={inputCls} placeholder="数字越大优先级越高" /></FormRow>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={() => {
              if (!form.name) return
              setTypes(prev => [...prev, { id: `pt${Date.now()}`, name: form.name, minOrder: +form.minOrder, priority: +form.priority, productCount: 0, status: '启用', createdAt: new Date().toISOString().slice(0, 10) }])
              setShowAdd(false); showToast('政策类型创建成功')
            }} disabled={!form.name} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">确认新增</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ======================== Tab: 价格政策 ========================

function TabPricePolicies() {
  const [filter, setFilter] = useState('全部')
  const [groupFilter, setGroupFilter] = useState('all')
  const [policies, setPolicies] = useState(initPricePolicies)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '',
    productName: PRODUCTS[0],
    ticketType: TICKET_TYPES[0],
    policyType: '散客预定',
    groupId: GROUPS_DIST[0].id,
    startDate: '',
    endDate: '',
    minOrder: '0',
    retailPrice: '',
    settlementPrice: '',
    priority: '1',
  })
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const opts = ['全部', '审批中', '已发布', '已下架']
  const filtered = policies.filter(p => {
    if (filter !== '全部' && p.status !== filter) return false
    if (groupFilter !== 'all' && p.groupId !== groupFilter) return false
    return true
  })
  const statusColor: Record<string, string> = { '已发布': 'bg-green-50 text-green-700', '审批中': 'bg-yellow-50 text-yellow-700', '已下架': 'bg-gray-100 text-gray-500' }

  const openAdd = () => {
    setForm({
      name: '',
      productName: PRODUCTS[0],
      ticketType: TICKET_TYPES[0],
      policyType: '散客预定',
      groupId: GROUPS_DIST[0].id,
      startDate: '',
      endDate: '',
      minOrder: '0',
      retailPrice: '',
      settlementPrice: '',
      priority: '1',
    })
    setShowAdd(true)
  }

  return (
    <div>
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
        价格政策按分销商分组关联生效；分组内分销商共享同一套零售价/结算价，不再按单个分销商挂政策。
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {opts.map(o => <button key={o} onClick={() => setFilter(o)} className={`rounded-lg px-3 py-1.5 text-sm ${filter === o ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{o}</button>)}
        </div>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700"
        >
          <option value="all">全部分组</option>
          {GROUPS_DIST.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button onClick={openAdd} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700 ml-auto"><Plus className="h-4 w-4" />新增价格政策</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">政策名称</th>
              <th className="px-4 py-3 text-left font-medium">产品/票类</th>
              <th className="px-4 py-3 text-left font-medium">政策类型</th>
              <th className="px-4 py-3 text-left font-medium">适用分销商分组</th>
              <th className="px-4 py-3 text-left font-medium">生效日期</th>
              <th className="px-4 py-3 text-right font-medium">起订量</th>
              <th className="px-4 py-3 text-right font-medium">零售价</th>
              <th className="px-4 py-3 text-right font-medium">结算价</th>
              <th className="px-4 py-3 text-center font-medium">状态</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3"><div className="text-gray-900">{p.productName}</div><div className="text-xs text-gray-400">{p.ticketType}</div></td>
                <td className="px-4 py-3 text-gray-600">{p.policyType}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {p.groupName}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.startDate} ~ {p.endDate}</td>
                <td className="px-4 py-3 text-right text-gray-700">{p.minOrder > 0 ? `≥${p.minOrder}人` : '-'}</td>
                <td className="px-4 py-3 text-right text-gray-700">¥{p.retailPrice}</td>
                <td className="px-4 py-3 text-right font-semibold text-blue-700">¥{p.settlementPrice}</td>
                <td className="px-4 py-3 text-center"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[p.status] ?? ''}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <button className="text-blue-600 hover:text-blue-700">编辑</button>
                    {p.status === '已发布' && <button onClick={() => { setPolicies(prev => prev.map(x => x.id === p.id ? { ...x, status: '已下架' } : x)); showToast('已下架') }} className="text-gray-600 hover:text-gray-700">下架</button>}
                    {p.status === '已下架' && <button onClick={() => { setPolicies(prev => prev.map(x => x.id === p.id ? { ...x, status: '已发布' } : x)); showToast('已重新发布') }} className="text-green-600 hover:text-green-700">发布</button>}
                    {p.status === '审批中' && <button onClick={() => { setPolicies(prev => prev.filter(x => x.id !== p.id)); showToast('已删除') }} className="text-red-500 hover:text-red-600">删除</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">暂无匹配的价格政策</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="新增价格政策" onClose={() => setShowAdd(false)} width="max-w-2xl">
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <FormRow label="政策名称" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="如：国庆节特惠政策" /></FormRow>
              <FormRow label="产品" required><select value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} className={selectCls}>{PRODUCTS.map(p => <option key={p}>{p}</option>)}</select></FormRow>
              <FormRow label="票类" required><select value={form.ticketType} onChange={e => setForm(f => ({ ...f, ticketType: e.target.value }))} className={selectCls}>{TICKET_TYPES.map(t => <option key={t}>{t}</option>)}</select></FormRow>
              <FormRow label="政策类型" required><select value={form.policyType} onChange={e => setForm(f => ({ ...f, policyType: e.target.value }))} className={selectCls}><option>散客预定</option><option>团队预定</option><option>大团队预定</option></select></FormRow>
              <FormRow label="分销商分组" required>
                <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className={selectCls}>
                  {GROUPS_DIST.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </FormRow>
            </div>
            <div>
              <FormRow label="生效开始" required><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} /></FormRow>
              <FormRow label="生效结束" required><input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} /></FormRow>
              <FormRow label="最低起订"><div className="flex items-center gap-2"><input type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} className={inputCls} /><span className="shrink-0 text-sm text-gray-500">人</span></div></FormRow>
              <FormRow label="零售价" required><input type="number" value={form.retailPrice} onChange={e => setForm(f => ({ ...f, retailPrice: e.target.value }))} className={inputCls} placeholder="元" /></FormRow>
              <FormRow label="结算价" required><input type="number" value={form.settlementPrice} onChange={e => setForm(f => ({ ...f, settlementPrice: e.target.value }))} className={inputCls} placeholder="元" /></FormRow>
              <FormRow label="优先级"><input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={inputCls} /></FormRow>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={() => {
              if (!form.name || !form.retailPrice || !form.settlementPrice) return
              const group = GROUPS_DIST.find((g) => g.id === form.groupId) ?? GROUPS_DIST[0]
              setPolicies(prev => [...prev, {
                id: `pp${Date.now()}`,
                name: form.name,
                productName: form.productName,
                ticketType: form.ticketType,
                policyType: form.policyType,
                groupId: group.id,
                groupName: group.name,
                startDate: form.startDate,
                endDate: form.endDate,
                minOrder: +form.minOrder,
                retailPrice: +form.retailPrice,
                settlementPrice: +form.settlementPrice,
                priority: +form.priority,
                status: '审批中',
              }])
              setShowAdd(false); showToast('价格政策已提交审批')
            }} disabled={!form.name || !form.retailPrice || !form.settlementPrice} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">提交审批</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ======================== Tab: 退改政策 ========================

function TabRefundPolicies() {
  const [groupFilter, setGroupFilter] = useState('all')
  const [policies, setPolicies] = useState(initRefundPolicies)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '',
    productName: PRODUCTS[0],
    ticketType: TICKET_TYPES[0],
    groupId: GROUPS_DIST[0].id,
    startDate: '',
    endDate: '',
    allowRefund: true,
    feeRules: '',
    priority: '1',
  })
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const statusColor: Record<string, string> = { '已发布': 'bg-green-50 text-green-700', '审批中': 'bg-yellow-50 text-yellow-700', '已下架': 'bg-gray-100 text-gray-500' }

  const filtered = policies.filter((p) => groupFilter === 'all' || p.groupId === groupFilter)

  const openAdd = () => {
    setForm({
      name: '',
      productName: PRODUCTS[0],
      ticketType: TICKET_TYPES[0],
      groupId: GROUPS_DIST[0].id,
      startDate: '',
      endDate: '',
      allowRefund: true,
      feeRules: '',
      priority: '1',
    })
    setShowAdd(true)
  }

  return (
    <div>
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700"
        >
          <option value="all">全部分组</option>
          {GROUPS_DIST.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button onClick={openAdd} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700 ml-auto"><Plus className="h-4 w-4" />新增退改政策</button>
      </div>
      <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
        退改政策同样按分销商分组关联。未配置专属退改政策的分组，默认沿用产品原有退改规则。
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">政策名称</th>
              <th className="px-4 py-3 text-left font-medium">产品/票类</th>
              <th className="px-4 py-3 text-left font-medium">适用分销商分组</th>
              <th className="px-4 py-3 text-left font-medium">生效日期</th>
              <th className="px-4 py-3 text-center font-medium">允许退票</th>
              <th className="px-4 py-3 text-left font-medium">退改规则说明</th>
              <th className="px-4 py-3 text-center font-medium">状态</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3"><div>{p.productName}</div><div className="text-xs text-gray-400">{p.ticketType}</div></td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {p.groupName}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.startDate} ~ {p.endDate}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${p.allowRefund ? 'text-green-700' : 'text-red-600'}`}>
                    {p.allowRefund ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    {p.allowRefund ? '允许' : '不允许'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{p.feeRules}</td>
                <td className="px-4 py-3 text-center"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[p.status] ?? ''}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <button className="text-blue-600 hover:text-blue-700">编辑</button>
                    {p.status === '已发布' && <button onClick={() => { setPolicies(prev => prev.map(x => x.id === p.id ? { ...x, status: '已下架' } : x)); showToast('已下架') }} className="text-gray-600 hover:text-gray-700">下架</button>}
                    {p.status === '已下架' && <button onClick={() => { setPolicies(prev => prev.map(x => x.id === p.id ? { ...x, status: '已发布' } : x)); showToast('已重新发布') }} className="text-green-600 hover:text-green-700">发布</button>}
                    {(p.status === '审批中' || p.status === '已下架') && <button onClick={() => { setPolicies(prev => prev.filter(x => x.id !== p.id)); showToast('已删除') }} className="text-red-500 hover:text-red-600">删除</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">暂无匹配的退改政策</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="新增退改政策" onClose={() => setShowAdd(false)} width="max-w-xl">
          <div className="space-y-0">
            <FormRow label="政策名称" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="如：暑期OTA退改政策" /></FormRow>
            <FormRow label="产品" required><select value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} className={selectCls}>{PRODUCTS.map(p => <option key={p}>{p}</option>)}</select></FormRow>
            <FormRow label="票类" required><select value={form.ticketType} onChange={e => setForm(f => ({ ...f, ticketType: e.target.value }))} className={selectCls}>{TICKET_TYPES.map(t => <option key={t}>{t}</option>)}</select></FormRow>
            <FormRow label="分销商分组" required>
              <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className={selectCls}>
                {GROUPS_DIST.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </FormRow>
            <FormRow label="生效日期" required>
              <div className="flex items-center gap-2">
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                <span className="text-sm text-gray-500">至</span>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
              </div>
            </FormRow>
            <FormRow label="允许退票">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.allowRefund} onChange={e => setForm(f => ({ ...f, allowRefund: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">允许退票</span>
              </label>
            </FormRow>
            <FormRow label="退改规则" required><textarea value={form.feeRules} onChange={e => setForm(f => ({ ...f, feeRules: e.target.value }))} rows={3} className={inputCls} placeholder="如：7天前免费退；3-7天收10%手续费；3天内不可退" /></FormRow>
            <FormRow label="优先级"><input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={inputCls} /></FormRow>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={() => {
              if (!form.name || !form.feeRules) return
              const group = GROUPS_DIST.find((g) => g.id === form.groupId) ?? GROUPS_DIST[0]
              setPolicies(prev => [...prev, {
                id: `rp${Date.now()}`,
                name: form.name,
                productName: form.productName,
                ticketType: form.ticketType,
                groupId: group.id,
                groupName: group.name,
                startDate: form.startDate,
                endDate: form.endDate,
                allowRefund: form.allowRefund,
                feeRules: form.feeRules,
                priority: +form.priority,
                status: '审批中',
              }])
              setShowAdd(false); showToast('退改政策已提交审批')
            }} disabled={!form.name || !form.feeRules} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">提交审批</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ======================== 主页面 ========================

const TABS = [
  { key: 'dist_products', label: '分销列表' },
  { key: 'policy_types', label: '价格政策类型' },
  { key: 'price_policies', label: '价格政策' },
  { key: 'refund_policies', label: '退改政策' },
]

export default function DistributionManagementPage() {
  const [activeTab, setActiveTab] = useState('dist_products')
  return (
    <div>
      <PageHeader title="分销管理" description="维护分销产品与分销商分组的授权关系；价格政策、退改政策均以分销商分组为维度关联。" />
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>{tab.label}</button>
          ))}
        </div>
      </div>
      {activeTab === 'dist_products' && <TabDistProducts />}
      {activeTab === 'policy_types' && <TabPolicyTypes />}
      {activeTab === 'price_policies' && <TabPricePolicies />}
      {activeTab === 'refund_policies' && <TabRefundPolicies />}
    </div>
  )
}
