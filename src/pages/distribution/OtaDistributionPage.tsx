import { useState } from 'react'
import { Plus, Link, ArrowUp, ArrowDown, X } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'

// ======================== Mock 数据 ========================

const initOtaChannels = [
  { id: 'ota1', name: '美团', icon: '🟡', bindingStatus: '已绑定', dealerName: '途牛旅游网络', dealerAccount: 'tuniu_cq', bindAt: '2025-03-01', productCount: 8 },
  { id: 'ota2', name: '携程', icon: '🔵', bindingStatus: '已绑定', dealerName: '途牛旅游网络', dealerAccount: 'tuniu_cq', bindAt: '2025-03-01', productCount: 6 },
  { id: 'ota3', name: '抖音', icon: '⚫', bindingStatus: '已绑定', dealerName: '驴妈妈旅游网', dealerAccount: 'lvmama_cruise', bindAt: '2025-06-15', productCount: 5 },
  { id: 'ota4', name: '同程', icon: '🟠', bindingStatus: '未绑定', dealerName: '-', dealerAccount: '-', bindAt: '-', productCount: 0 },
  { id: 'ota5', name: '飞猪', icon: '🟢', bindingStatus: '未绑定', dealerName: '-', dealerAccount: '-', bindAt: '-', productCount: 0 },
  { id: 'ota6', name: '抖音团购', icon: '⚫', bindingStatus: '已绑定', dealerName: '驴妈妈旅游网', dealerAccount: 'lvmama_cruise', bindAt: '2025-09-01', productCount: 3 },
]

const DEALERS_LIST = ['途牛旅游网络', '驴妈妈旅游网', '重庆中旅国际', '三峡国际旅行社']
const DEALER_ACCOUNTS: Record<string, string> = {
  '途牛旅游网络': 'tuniu_cq',
  '驴妈妈旅游网': 'lvmama_cruise',
  '重庆中旅国际': 'zhonglv_cq',
  '三峡国际旅行社': 'sanxia_intl',
}

const initBoatTickets = [
  { id: 'bt1', channel: '美团', productName: '长江三峡5日游', otaName: '【官方】长江三峡5日游豪华游轮', ticketType: '成人票', costPrice: 1200, marketPrice: 1680, retailPrice: 1580, settlementPrice: 1280, merchantId: 'MT_8812345', attractionId: 'AT_88234', status: '已上架', multiStore: false, semiDirect: false },
  { id: 'bt2', channel: '美团', productName: '长江三峡5日游', otaName: '【官方】长江三峡5日游豪华游轮', ticketType: '儿童票', costPrice: 600, marketPrice: 840, retailPrice: 780, settlementPrice: 640, merchantId: 'MT_8812345', attractionId: 'AT_88234', status: '已上架', multiStore: false, semiDirect: false },
  { id: 'bt3', channel: '携程', productName: '长江三峡5日游', otaName: '长江三峡豪华游轮5天4夜旗舰版', ticketType: '成人票', costPrice: 1200, marketPrice: 1680, retailPrice: 1620, settlementPrice: 1300, merchantId: 'CX_99234', attractionId: 'AT_99122', status: '已上架', multiStore: true, semiDirect: false },
  { id: 'bt4', channel: '携程', productName: '黄金水道4日游', otaName: '黄金水道长江游轮4日游', ticketType: '成人票', costPrice: 980, marketPrice: 1380, retailPrice: 1320, settlementPrice: 1050, merchantId: 'CX_99234', attractionId: 'AT_99233', status: '已上架', multiStore: false, semiDirect: false },
  { id: 'bt5', channel: '抖音', productName: '三峡人家精华游3日', otaName: '三峡人家3日精华游轮之旅', ticketType: '成人票', costPrice: 780, marketPrice: 1080, retailPrice: 980, settlementPrice: 820, merchantId: 'DY_77123', attractionId: 'AT_77345', status: '已下架', multiStore: false, semiDirect: true },
  { id: 'bt6', channel: '抖音团购', productName: '长江三峡5日游', otaName: '三峡游轮5日团购特惠', ticketType: '成人票', costPrice: 1200, marketPrice: 1680, retailPrice: 1480, settlementPrice: 1250, merchantId: 'DY_77123', attractionId: 'AT_77111', status: '已上架', multiStore: false, semiDirect: false },
]

const initPackageProducts = [
  { id: 'pp1', channel: '美团', productName: '三峡亲子套票', otaName: '【亲子出游】长江三峡豪华游轮亲子套票', ticketType: '亲子票（成人+儿童）', costPrice: 1680, marketPrice: 2380, retailPrice: 2180, settlementPrice: 1880, merchantId: 'MT_8812345', attractionId: 'AT_88290', status: '已上架', multiStore: false, semiDirect: false },
  { id: 'pp2', channel: '携程', productName: '豪华舱双人套餐', otaName: '长江三峡豪华舱双人游轮套餐', ticketType: '双人票', costPrice: 2600, marketPrice: 3600, retailPrice: 3400, settlementPrice: 2900, merchantId: 'CX_99234', attractionId: 'AT_99300', status: '已上架', multiStore: false, semiDirect: false },
  { id: 'pp3', channel: '抖音', productName: '船餐套餐', otaName: '三峡游轮船票+特色餐饮套餐', ticketType: '成人套餐', costPrice: 1380, marketPrice: 1880, retailPrice: 1720, settlementPrice: 1480, merchantId: 'DY_77123', attractionId: 'AT_77400', status: '已上架', multiStore: false, semiDirect: false },
]

const initPeriodProducts = [
  { id: 'ep1', channel: '美团', productName: '三峡游轮暑期通票', otaName: '长江三峡暑期游轮通票（7-8月通用）', ticketType: '成人票', costPrice: 980, marketPrice: 1380, retailPrice: 1280, settlementPrice: 1080, merchantId: 'MT_8812345', attractionId: 'AT_88500', status: '已上架', multiStore: false, semiDirect: false },
  { id: 'ep2', channel: '携程', productName: '国庆黄金周游轮通票', otaName: '长江三峡国庆期间游轮畅游通票', ticketType: '成人票', costPrice: 1100, marketPrice: 1600, retailPrice: 1480, settlementPrice: 1200, merchantId: 'CX_99234', attractionId: 'AT_99600', status: '已下架', multiStore: false, semiDirect: false },
]

const PRODUCTS = ['长江三峡5日游', '黄金水道4日游', '三峡人家精华游3日', '长江明珠豪华游轮7日']
const TICKET_TYPES = ['成人票', '儿童票', '老年票', '亲子票', '双人票', '成人套餐']
const CATEGORIES = ['游轮船票', '亲子产品', '团队产品', '特惠产品']

type Product = typeof initBoatTickets[number]

// ======================== 弹窗组件 ========================

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
      <label className="w-28 shrink-0 pt-2 text-sm text-gray-700 text-right">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const selectCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// 绑定分销商弹窗
function BindDealerModal({ channel, onClose, onSave }: { channel: typeof initOtaChannels[number]; onClose: () => void; onSave: (dealerName: string, account: string) => void }) {
  const [searchKw, setSearchKw] = useState(channel.dealerName !== '-' ? channel.dealerName : '')
  const [selected, setSelected] = useState(channel.dealerName !== '-' ? channel.dealerName : '')

  const matched = DEALERS_LIST.filter(d => d.includes(searchKw))

  return (
    <Modal title={`${channel.name} — 绑定分销商`} onClose={onClose}>
      <p className="mb-3 text-sm text-gray-500">绑定后，该渠道的订单授信将从所绑定分销商账户扣除。</p>
      <div className="flex gap-2 mb-3">
        <input value={searchKw} onChange={e => setSearchKw(e.target.value)} placeholder="搜索分销商名称" className={inputCls} />
        <button className="rounded-lg bg-gray-100 px-3 text-sm text-gray-700 hover:bg-gray-200">搜索</button>
      </div>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-48 overflow-y-auto">
        {matched.map(d => (
          <div key={d} onClick={() => setSelected(d)} className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 ${selected === d ? 'bg-blue-50' : ''}`}>
            <div>
              <div className="text-sm font-medium text-gray-900">{d}</div>
              <div className="text-xs text-gray-400">账号：{DEALER_ACCOUNTS[d]}</div>
            </div>
            {selected === d && <span className="text-xs text-blue-600 font-medium">已选中</span>}
          </div>
        ))}
        {matched.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400">未找到匹配分销商</div>}
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button onClick={() => { if (selected) { onSave(selected, DEALER_ACCOUNTS[selected]); onClose() } }} disabled={!selected} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">确认绑定</button>
      </div>
    </Modal>
  )
}

// 新增产品弹窗
function AddProductModal({ channelName, onClose, onSave }: { channelName: string; onClose: () => void; onSave: (p: Partial<Product>) => void }) {
  const [form, setForm] = useState({ productName: PRODUCTS[0], otaName: '', ticketType: TICKET_TYPES[0], costPrice: '', marketPrice: '', retailPrice: '', settlementPrice: '', merchantId: '', attractionId: '', multiStore: false, semiDirect: false })

  return (
    <Modal title={`新增 ${channelName} 渠道产品`} onClose={onClose} width="max-w-2xl">
      <div className="grid grid-cols-2 gap-x-6">
        <div>
          <FormRow label="选择产品" required>
            <select value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} className={selectCls}>
              {PRODUCTS.map(p => <option key={p}>{p}</option>)}
            </select>
          </FormRow>
          <FormRow label="票类" required>
            <select value={form.ticketType} onChange={e => setForm(f => ({ ...f, ticketType: e.target.value }))} className={selectCls}>
              {TICKET_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormRow>
          <FormRow label="OTA展示名称" required><input value={form.otaName} onChange={e => setForm(f => ({ ...f, otaName: e.target.value }))} className={inputCls} placeholder="OTA平台前端展示的产品名称" /></FormRow>
          <FormRow label="成本价"><input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} className={inputCls} placeholder="元" /></FormRow>
          <FormRow label="门市价"><input type="number" value={form.marketPrice} onChange={e => setForm(f => ({ ...f, marketPrice: e.target.value }))} className={inputCls} placeholder="元" /></FormRow>
        </div>
        <div>
          <FormRow label="零售价" required><input type="number" value={form.retailPrice} onChange={e => setForm(f => ({ ...f, retailPrice: e.target.value }))} className={inputCls} placeholder="OTA对外销售价" /></FormRow>
          <FormRow label="渠道结算价" required><input type="number" value={form.settlementPrice} onChange={e => setForm(f => ({ ...f, settlementPrice: e.target.value }))} className={inputCls} placeholder="与分销商结算价" /></FormRow>
          <FormRow label="商家ID"><input value={form.merchantId} onChange={e => setForm(f => ({ ...f, merchantId: e.target.value }))} className={inputCls} placeholder={`${channelName}商家账号ID`} /></FormRow>
          <FormRow label="景点ID"><input value={form.attractionId} onChange={e => setForm(f => ({ ...f, attractionId: e.target.value }))} className={inputCls} placeholder={`${channelName}景点/门店ID`} /></FormRow>
          <FormRow label="其他设置">
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.multiStore} onChange={e => setForm(f => ({ ...f, multiStore: e.target.checked }))} /><span className="text-sm text-gray-700">多门店模式</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.semiDirect} onChange={e => setForm(f => ({ ...f, semiDirect: e.target.checked }))} /><span className="text-sm text-gray-700">半直连模式</span></label>
            </div>
          </FormRow>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button onClick={() => {
          if (!form.otaName || !form.retailPrice || !form.settlementPrice) return
          onSave({ id: `bt${Date.now()}`, channel: channelName, productName: form.productName, otaName: form.otaName, ticketType: form.ticketType, costPrice: +form.costPrice, marketPrice: +form.marketPrice, retailPrice: +form.retailPrice, settlementPrice: +form.settlementPrice, merchantId: form.merchantId, attractionId: form.attractionId, status: '已上架', multiStore: form.multiStore, semiDirect: form.semiDirect })
          onClose()
        }} disabled={!form.otaName || !form.retailPrice || !form.settlementPrice} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">保存上架</button>
      </div>
    </Modal>
  )
}

// 修改名称弹窗
function RenameModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(product.otaName)
  return (
    <Modal title="修改OTA展示名称" onClose={onClose}>
      <FormRow label="原名称"><span className="pt-2 text-sm text-gray-500">{product.otaName}</span></FormRow>
      <FormRow label="新名称" required><input value={name} onChange={e => setName(e.target.value)} className={inputCls} /></FormRow>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button onClick={() => { onSave(name); onClose() }} disabled={!name.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">保存</button>
      </div>
    </Modal>
  )
}

// 绑定ID弹窗
function BindIdModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (merchantId: string, attractionId: string) => void }) {
  const [merchantId, setMerchantId] = useState(product.merchantId)
  const [attractionId, setAttractionId] = useState(product.attractionId)
  const [category, setCategory] = useState(CATEGORIES[0])
  return (
    <Modal title="绑定渠道ID" onClose={onClose}>
      <div className="mb-3 text-sm text-gray-500">
        将本平台产品与 <strong>{product.channel}</strong> 渠道商品进行编码绑定，绑定后订单可自动同步。
      </div>
      <div className="space-y-0">
        <FormRow label="商家ID" required>
          <input value={merchantId} onChange={e => setMerchantId(e.target.value)} className={inputCls} placeholder={`${product.channel}商家账号ID`} />
        </FormRow>
        <FormRow label="景点/门店ID" required>
          <input value={attractionId} onChange={e => setAttractionId(e.target.value)} className={inputCls} placeholder={`${product.channel}景点或门店ID`} />
        </FormRow>
        <FormRow label="分类ID">
          <select value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </FormRow>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button onClick={() => { onSave(merchantId, attractionId); onClose() }} disabled={!merchantId || !attractionId} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">确认绑定</button>
      </div>
    </Modal>
  )
}

// ======================== OTA管理Tab ========================

function TabOtaManage() {
  const [channels, setChannels] = useState(initOtaChannels)
  const [bindTarget, setBindTarget] = useState<typeof initOtaChannels[number] | null>(null)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  return (
    <div>
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <p className="mb-4 text-sm text-gray-500">维护OTA渠道基础档案，完成渠道与分销商账号绑定。绑定分销商后，该渠道订单授信从对应账户扣除。</p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">渠道</th>
              <th className="px-4 py-3 text-center font-medium">绑定状态</th>
              <th className="px-4 py-3 text-left font-medium">绑定分销商</th>
              <th className="px-4 py-3 text-left font-medium">分销商账号</th>
              <th className="px-4 py-3 text-left font-medium">绑定时间</th>
              <th className="px-4 py-3 text-right font-medium">上架产品数</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {channels.map(ch => (
              <tr key={ch.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ch.icon}</span>
                    <span className="font-medium text-gray-900">{ch.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ch.bindingStatus === '已绑定' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{ch.bindingStatus}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">{ch.dealerName}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{ch.dealerAccount}</td>
                <td className="px-4 py-3 text-gray-500">{ch.bindAt}</td>
                <td className="px-4 py-3 text-right text-gray-700">{ch.productCount}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <button onClick={() => setBindTarget(ch)} className="text-blue-600 hover:text-blue-700">{ch.bindingStatus === '已绑定' ? '编辑绑定' : '绑定分销商'}</button>
                    {ch.bindingStatus === '已绑定' && (
                      <button onClick={() => { setChannels(prev => prev.map(x => x.id === ch.id ? { ...x, bindingStatus: '未绑定', dealerName: '-', dealerAccount: '-', bindAt: '-' } : x)); showToast('已解绑') }} className="text-red-500 hover:text-red-600">解绑</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bindTarget && (
        <BindDealerModal
          channel={bindTarget}
          onClose={() => setBindTarget(null)}
          onSave={(dealerName, account) => {
            setChannels(prev => prev.map(x => x.id === bindTarget.id ? { ...x, bindingStatus: '已绑定', dealerName, dealerAccount: account, bindAt: new Date().toISOString().slice(0, 10) } : x))
            showToast(`${bindTarget.name} 已绑定 ${dealerName}`)
          }}
        />
      )}
    </div>
  )
}

// ======================== 通用产品表格 ========================

function ProductTable({ initData, channelTabs }: { initData: typeof initBoatTickets; channelTabs: string[] }) {
  const [products, setProducts] = useState(initData)
  const [activeChannel, setActiveChannel] = useState(channelTabs[0])
  const [showAdd, setShowAdd] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Product | null>(null)
  const [bindIdTarget, setBindIdTarget] = useState<Product | null>(null)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const filtered = products.filter(d => d.channel === activeChannel)

  return (
    <div>
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}

      {/* 渠道Tab */}
      <div className="mb-4 border-b border-gray-200">
        <div className="flex gap-0">
          {channelTabs.map(ch => (
            <button key={ch} onClick={() => setActiveChannel(ch)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeChannel === ch ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>{ch}</button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => setShowAdd(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700"><Plus className="h-4 w-4" />新增产品</button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-sm text-gray-400">
          暂无 {activeChannel} 渠道产品配置，点击【新增产品】添加
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">产品名称</th>
                <th className="px-4 py-3 text-left font-medium">OTA展示名称</th>
                <th className="px-4 py-3 text-left font-medium">票类</th>
                <th className="px-4 py-3 text-right font-medium">成本价</th>
                <th className="px-4 py-3 text-right font-medium">门市价</th>
                <th className="px-4 py-3 text-right font-medium">零售价</th>
                <th className="px-4 py-3 text-right font-medium">渠道结算价</th>
                <th className="px-4 py-3 text-left font-medium">绑定ID</th>
                <th className="px-4 py-3 text-center font-medium">状态</th>
                <th className="px-4 py-3 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate" title={p.otaName}>{p.otaName}</td>
                  <td className="px-4 py-3 text-gray-600">{p.ticketType}</td>
                  <td className="px-4 py-3 text-right text-gray-500">¥{p.costPrice}</td>
                  <td className="px-4 py-3 text-right text-gray-700">¥{p.marketPrice}</td>
                  <td className="px-4 py-3 text-right text-gray-700">¥{p.retailPrice}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-700">¥{p.settlementPrice}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div>{p.merchantId || <span className="text-gray-300">未绑定</span>}</div>
                    <div className="text-gray-400">{p.attractionId || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${p.status === '已上架' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
                      <button onClick={() => setRenameTarget(p)} className="text-blue-600 hover:text-blue-700">改名称</button>
                      <button onClick={() => setBindIdTarget(p)} className="inline-flex items-center gap-0.5 text-gray-600 hover:text-gray-700"><Link className="h-3 w-3" />绑定ID</button>
                      {p.status === '已上架'
                        ? <button onClick={() => { setProducts(prev => prev.map(x => x.id === p.id ? { ...x, status: '已下架' } : x)); showToast('已下架') }} className="inline-flex items-center gap-0.5 text-orange-500 hover:text-orange-600"><ArrowDown className="h-3 w-3" />下架</button>
                        : <button onClick={() => { setProducts(prev => prev.map(x => x.id === p.id ? { ...x, status: '已上架' } : x)); showToast('已上架') }} className="inline-flex items-center gap-0.5 text-green-600 hover:text-green-700"><ArrowUp className="h-3 w-3" />上架</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddProductModal
          channelName={activeChannel}
          onClose={() => setShowAdd(false)}
          onSave={p => { setProducts(prev => [...prev, p as Product]); showToast('产品新增成功，已上架') }}
        />
      )}
      {renameTarget && (
        <RenameModal
          product={renameTarget}
          onClose={() => setRenameTarget(null)}
          onSave={name => { setProducts(prev => prev.map(x => x.id === renameTarget.id ? { ...x, otaName: name } : x)); showToast('名称修改成功') }}
        />
      )}
      {bindIdTarget && (
        <BindIdModal
          product={bindIdTarget}
          onClose={() => setBindIdTarget(null)}
          onSave={(merchantId, attractionId) => { setProducts(prev => prev.map(x => x.id === bindIdTarget.id ? { ...x, merchantId, attractionId } : x)); showToast('ID绑定成功') }}
        />
      )}
    </div>
  )
}

// ======================== 主页面 ========================

const BOAT_CHANNELS = ['美团', '携程', '抖音', '抖音团购']
const PACKAGE_CHANNELS = ['美团', '携程', '抖音']
const PERIOD_CHANNELS = ['美团', '携程']

const TABS = [
  { key: 'ota_manage', label: 'OTA管理' },
  { key: 'boat_tickets', label: 'OTA船票产品' },
  { key: 'packages', label: 'OTA套票产品' },
  { key: 'period', label: 'OTA期票产品' },
]

export default function OtaDistributionPage() {
  const [activeTab, setActiveTab] = useState('ota_manage')

  return (
    <div>
      <PageHeader title="OTA平台分销" description="统一管控抖音、美团、携程等OTA渠道产品上架与分销配置。" />
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>{tab.label}</button>
          ))}
        </div>
      </div>
      {activeTab === 'ota_manage' && <TabOtaManage />}
      {activeTab === 'boat_tickets' && <ProductTable key="boat" initData={initBoatTickets} channelTabs={BOAT_CHANNELS} />}
      {activeTab === 'packages' && <ProductTable key="package" initData={initPackageProducts} channelTabs={PACKAGE_CHANNELS} />}
      {activeTab === 'period' && <ProductTable key="period" initData={initPeriodProducts} channelTabs={PERIOD_CHANNELS} />}
    </div>
  )
}
