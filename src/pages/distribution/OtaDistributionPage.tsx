import { useState } from 'react'
import { Plus, Link, ArrowUp, ArrowDown, X, CalendarDays, Pencil, Eye } from 'lucide-react'
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

type VoucherVoyageStatus = '启用' | '停用'

interface VoucherVoyageConfig {
  id: string
  channel: string
  voucherName: string
  voucherSku: string
  routeName: string
  roomTypes: string[]
  voyageCount: number
  voyageDates: string[]
  quota: number
  redeemed: number
  advanceDays: number
  validStart: string
  validEnd: string
  status: VoucherVoyageStatus
  updatedAt: string
}

const OTA_VOUCHER_PRODUCTS = [
  '长江三峡双人游兑换券',
  '三峡亲子家庭游兑换券',
  '豪华阳台房升舱兑换券',
  '长江探索号暑期兑换券',
]

const OTA_ROUTES = [
  '重庆-宜昌三峡航线（下水）',
  '宜昌-重庆三峡航线（上水）',
  '武汉-九江-南京-上海长江中下游航线',
]

const OTA_ROOM_TYPES = ['标准间', '阳台房', '行政房', '豪华套房']

const MOCK_VOYAGE_OPTIONS = [
  { id: 'ov1', no: 'CJ20260706-TXS', date: '2026-07-06', ship: '长江探索号', route: OTA_ROUTES[0], stock: 36 },
  { id: 'ov2', no: 'CJ20260713-TXS', date: '2026-07-13', ship: '长江探索号', route: OTA_ROUTES[0], stock: 28 },
  { id: 'ov3', no: 'CJ20260720-SJ', date: '2026-07-20', ship: '世纪游轮', route: OTA_ROUTES[0], stock: 42 },
  { id: 'ov4', no: 'CJ20260727-HJ', date: '2026-07-27', ship: '黄金游轮', route: OTA_ROUTES[1], stock: 31 },
  { id: 'ov5', no: 'CJ20260803-HJ', date: '2026-08-03', ship: '黄金游轮', route: OTA_ROUTES[1], stock: 25 },
  { id: 'ov6', no: 'CJ20260810-TXS', date: '2026-08-10', ship: '长江探索号', route: OTA_ROUTES[2], stock: 18 },
]

const initVoucherVoyageConfigs: VoucherVoyageConfig[] = [
  {
    id: 'ovc1', channel: '美团', voucherName: '长江三峡双人游兑换券', voucherSku: 'MT-VCH-202607-001',
    routeName: OTA_ROUTES[0], roomTypes: ['标准间', '阳台房'], voyageCount: 3,
    voyageDates: ['2026-07-06', '2026-07-13', '2026-07-20'], quota: 90, redeemed: 37,
    advanceDays: 3, validStart: '2026-07-01', validEnd: '2026-08-31', status: '启用', updatedAt: '2026-07-04 15:20',
  },
  {
    id: 'ovc2', channel: '携程', voucherName: '豪华阳台房升舱兑换券', voucherSku: 'CTRIP-VCH-88021',
    routeName: OTA_ROUTES[1], roomTypes: ['阳台房', '行政房'], voyageCount: 2,
    voyageDates: ['2026-07-27', '2026-08-03'], quota: 48, redeemed: 16,
    advanceDays: 5, validStart: '2026-07-15', validEnd: '2026-09-15', status: '启用', updatedAt: '2026-07-03 11:08',
  },
  {
    id: 'ovc3', channel: '抖音团购', voucherName: '长江探索号暑期兑换券', voucherSku: 'DY-VCH-66008',
    routeName: OTA_ROUTES[2], roomTypes: ['标准间'], voyageCount: 1,
    voyageDates: ['2026-08-10'], quota: 20, redeemed: 0,
    advanceDays: 7, validStart: '2026-08-01', validEnd: '2026-08-31', status: '停用', updatedAt: '2026-07-02 09:30',
  },
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

// ======================== OTA兑换券航次 ========================

function VoucherVoyageModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: VoucherVoyageConfig | null
  onClose: () => void
  onSave: (value: VoucherVoyageConfig) => void
}) {
  const [form, setForm] = useState({
    channel: initial?.channel ?? '美团',
    voucherName: initial?.voucherName ?? OTA_VOUCHER_PRODUCTS[0],
    voucherSku: initial?.voucherSku ?? '',
    routeName: initial?.routeName ?? OTA_ROUTES[0],
    roomTypes: initial?.roomTypes ?? ['标准间'],
    voyageDates: initial?.voyageDates ?? [],
    quota: initial?.quota ?? 20,
    advanceDays: initial?.advanceDays ?? 3,
    validStart: initial?.validStart ?? '2026-07-01',
    validEnd: initial?.validEnd ?? '2026-08-31',
    status: initial?.status ?? '启用' as VoucherVoyageStatus,
  })

  const availableVoyages = MOCK_VOYAGE_OPTIONS.filter(item => item.route === form.routeName)
  const toggleValue = (key: 'roomTypes' | 'voyageDates', value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(item => item !== value) : [...prev[key], value],
    }))
  }
  const canSave = form.voucherSku.trim() && form.roomTypes.length > 0 && form.voyageDates.length > 0 && form.quota > 0 && form.validStart && form.validEnd

  return (
    <Modal title={initial ? '编辑兑换券航次' : '新增兑换券航次'} onClose={onClose} width="max-w-4xl">
      <div className="max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-x-8">
          <FormRow label="OTA渠道" required>
            <select className={selectCls} value={form.channel} onChange={e => setForm(prev => ({ ...prev, channel: e.target.value }))}>
              {['美团', '携程', '抖音团购', '同程', '飞猪'].map(item => <option key={item}>{item}</option>)}
            </select>
          </FormRow>
          <FormRow label="兑换券产品" required>
            <select className={selectCls} value={form.voucherName} onChange={e => setForm(prev => ({ ...prev, voucherName: e.target.value }))}>
              {OTA_VOUCHER_PRODUCTS.map(item => <option key={item}>{item}</option>)}
            </select>
          </FormRow>
          <FormRow label="渠道券SKU" required>
            <input className={inputCls} value={form.voucherSku} onChange={e => setForm(prev => ({ ...prev, voucherSku: e.target.value }))} placeholder="请输入OTA侧券SKU/商品ID" />
          </FormRow>
          <FormRow label="适用航线" required>
            <select className={selectCls} value={form.routeName} onChange={e => setForm(prev => ({ ...prev, routeName: e.target.value, voyageDates: [] }))}>
              {OTA_ROUTES.map(item => <option key={item}>{item}</option>)}
            </select>
          </FormRow>
          <FormRow label="有效期开始" required>
            <input type="date" className={inputCls} value={form.validStart} onChange={e => setForm(prev => ({ ...prev, validStart: e.target.value }))} />
          </FormRow>
          <FormRow label="有效期结束" required>
            <input type="date" className={inputCls} value={form.validEnd} onChange={e => setForm(prev => ({ ...prev, validEnd: e.target.value }))} />
          </FormRow>
          <FormRow label="兑换配额" required>
            <div className="relative"><input type="number" min={1} className={`${inputCls} pr-10`} value={form.quota} onChange={e => setForm(prev => ({ ...prev, quota: +e.target.value }))} /><span className="absolute right-3 top-2 text-sm text-gray-400">间</span></div>
          </FormRow>
          <FormRow label="提前预约" required>
            <div className="relative"><input type="number" min={0} className={`${inputCls} pr-10`} value={form.advanceDays} onChange={e => setForm(prev => ({ ...prev, advanceDays: +e.target.value }))} /><span className="absolute right-3 top-2 text-sm text-gray-400">天</span></div>
          </FormRow>
        </div>

        <div className="mt-3 border-t border-gray-100 pt-4">
          <div className="mb-2 text-sm font-medium text-gray-800">可兑换房型 <span className="text-red-500">*</span></div>
          <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            {OTA_ROOM_TYPES.map(item => (
              <label key={item} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.roomTypes.includes(item)} onChange={() => toggleValue('roomTypes', item)} />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-800">选择可兑换航次 <span className="text-red-500">*</span></div>
            <div className="text-xs text-gray-400">已选择 {form.voyageDates.length} 个航次</div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr><th className="w-12 px-4 py-3"></th><th className="px-4 py-3 text-left font-medium">航次编号</th><th className="px-4 py-3 text-left font-medium">开航日期</th><th className="px-4 py-3 text-left font-medium">游轮</th><th className="px-4 py-3 text-right font-medium">当前可售</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {availableVoyages.map(item => (
                  <tr key={item.id} className={form.voyageDates.includes(item.date) ? 'bg-blue-50/60' : ''}>
                    <td className="px-4 py-3 text-center"><input type="checkbox" checked={form.voyageDates.includes(item.date)} onChange={() => toggleValue('voyageDates', item.date)} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.no}</td>
                    <td className="px-4 py-3 text-gray-700">{item.date}</td>
                    <td className="px-4 py-3 text-gray-700">{item.ship}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{item.stock} 间</td>
                  </tr>
                ))}
                {availableVoyages.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">该航线暂无可配置航次</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button
          disabled={!canSave}
          onClick={() => onSave({
            id: initial?.id ?? `ovc${Date.now()}`,
            ...form,
            voyageCount: form.voyageDates.length,
            redeemed: initial?.redeemed ?? 0,
            updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).split('/').join('-'),
          })}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          保存配置
        </button>
      </div>
    </Modal>
  )
}

function VoucherVoyageDetail({ config, onClose }: { config: VoucherVoyageConfig; onClose: () => void }) {
  return (
    <Modal title="兑换券航次详情" onClose={onClose} width="max-w-2xl">
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        {[
          ['OTA渠道', config.channel], ['渠道券SKU', config.voucherSku],
          ['兑换券产品', config.voucherName], ['状态', config.status],
          ['适用航线', config.routeName], ['可兑换房型', config.roomTypes.join('、')],
          ['券有效期', `${config.validStart} 至 ${config.validEnd}`], ['提前预约', `至少 ${config.advanceDays} 天`],
          ['兑换配额', `${config.quota} 间`], ['已兑换', `${config.redeemed} 间`],
        ].map(([label, value]) => (
          <div key={label}><div className="mb-1 text-xs text-gray-400">{label}</div><div className="text-gray-800">{value}</div></div>
        ))}
      </div>
      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="mb-2 text-sm font-medium text-gray-800">可兑换航次</div>
        <div className="flex flex-wrap gap-2">
          {config.voyageDates.map(date => <span key={date} className="rounded-md bg-blue-50 px-3 py-1.5 text-xs text-blue-700">{date}</span>)}
        </div>
      </div>
      <div className="mt-5 flex justify-end"><button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">关闭</button></div>
    </Modal>
  )
}

function TabVoucherVoyages() {
  const [configs, setConfigs] = useState(initVoucherVoyageConfigs)
  const [channel, setChannel] = useState('全部')
  const [status, setStatus] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [editing, setEditing] = useState<VoucherVoyageConfig | null | undefined>(undefined)
  const [detail, setDetail] = useState<VoucherVoyageConfig | null>(null)
  const [toast, setToast] = useState('')
  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast(''), 2500) }
  const filtered = configs.filter(item =>
    (channel === '全部' || item.channel === channel)
    && (status === '全部' || item.status === status)
    && (!keyword || item.voucherName.includes(keyword) || item.voucherSku.toLowerCase().includes(keyword.toLowerCase())),
  )

  return (
    <div>
      {toast && <div className="fixed top-6 left-1/2 z-[999] -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        将OTA侧兑换券绑定至本系统可售航次。消费者核销时，仅可选择这里配置的航线、航次与房型，兑换量从独立配额中扣减。
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <input className="h-9 w-64 rounded-lg border border-gray-300 bg-white px-3 text-sm" placeholder="兑换券名称 / 渠道券SKU" value={keyword} onChange={e => setKeyword(e.target.value)} />
        <select className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm" value={channel} onChange={e => setChannel(e.target.value)}>
          {['全部', '美团', '携程', '抖音团购', '同程', '飞猪'].map(item => <option key={item}>{item}</option>)}
        </select>
        <select className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
          {['全部', '启用', '停用'].map(item => <option key={item}>{item}</option>)}
        </select>
        <button onClick={() => { setKeyword(''); setChannel('全部'); setStatus('全部') }} className="h-9 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50">重置</button>
        <button onClick={() => setEditing(null)} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"><Plus className="h-4 w-4" />新增兑换券航次</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">OTA渠道</th>
              <th className="px-4 py-3 text-left font-medium">兑换券产品 / SKU</th>
              <th className="px-4 py-3 text-left font-medium">航线</th>
              <th className="px-4 py-3 text-left font-medium">可兑换房型</th>
              <th className="px-4 py-3 text-center font-medium">航次数</th>
              <th className="px-4 py-3 text-center font-medium">配额使用</th>
              <th className="px-4 py-3 text-left font-medium">有效期</th>
              <th className="px-4 py-3 text-center font-medium">状态</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(item => {
              const usage = Math.round(item.redeemed / item.quota * 100)
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.channel}</td>
                  <td className="px-4 py-3"><div className="font-medium text-gray-900">{item.voucherName}</div><div className="mt-0.5 font-mono text-xs text-gray-400">{item.voucherSku}</div></td>
                  <td className="max-w-[220px] px-4 py-3 text-gray-600">{item.routeName}</td>
                  <td className="px-4 py-3 text-gray-600">{item.roomTypes.join('、')}</td>
                  <td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1 text-blue-700"><CalendarDays className="h-3.5 w-3.5" />{item.voyageCount}</span></td>
                  <td className="px-4 py-3 text-center"><div className="text-gray-700">{item.redeemed} / {item.quota}</div><div className="mx-auto mt-1 h-1.5 w-20 overflow-hidden rounded bg-gray-100"><div className="h-full bg-blue-500" style={{ width: `${Math.min(usage, 100)}%` }} /></div></td>
                  <td className="px-4 py-3 text-xs text-gray-600"><div>{item.validStart}</div><div>至 {item.validEnd}</div></td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.status === '启用' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.status}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-3 text-xs">
                      <button onClick={() => setDetail(item)} className="inline-flex items-center gap-1 text-blue-600"><Eye className="h-3 w-3" />查看</button>
                      <button onClick={() => setEditing(item)} className="inline-flex items-center gap-1 text-blue-600"><Pencil className="h-3 w-3" />编辑</button>
                      <button onClick={() => { setConfigs(prev => prev.map(config => config.id === item.id ? { ...config, status: config.status === '启用' ? '停用' : '启用' } : config)); showToast(item.status === '启用' ? '配置已停用' : '配置已启用') }} className={item.status === '启用' ? 'text-orange-500' : 'text-green-600'}>{item.status === '启用' ? '停用' : '启用'}</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">暂无符合条件的兑换券航次配置</td></tr>}
          </tbody>
        </table>
      </div>
      {editing !== undefined && <VoucherVoyageModal initial={editing} onClose={() => setEditing(undefined)} onSave={value => { setConfigs(prev => prev.some(item => item.id === value.id) ? prev.map(item => item.id === value.id ? value : item) : [value, ...prev]); setEditing(undefined); showToast('兑换券航次配置已保存') }} />}
      {detail && <VoucherVoyageDetail config={detail} onClose={() => setDetail(null)} />}
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
  { key: 'voucher_voyages', label: 'OTA兑换券航次' },
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
      {activeTab === 'voucher_voyages' && <TabVoucherVoyages />}
    </div>
  )
}
