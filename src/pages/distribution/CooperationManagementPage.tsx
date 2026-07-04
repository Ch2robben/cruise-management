import { useState } from 'react'
import { Check, X, Plus, Search, Download, CreditCard, ChevronDown } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'

// ======================== Mock 数据 ========================

const GROUPS = [
  { id: 'g1', name: '重庆地区', count: 4 },
  { id: 'g2', name: '湖北地区', count: 3 },
  { id: 'g3', name: 'OTA渠道', count: 2 },
]

const initDealers = [
  { id: 'd1', groupId: 'g1', name: '三峡国际旅行社', type: '旅行社', contact: '张经理', phone: '023-6812-3456', creditLimit: 500000, usedCredit: 128000, balance: 42000, deposit: 20000, status: '启用', createdAt: '2024-01-15', licenseNo: 'L-CQ-2024-001' },
  { id: 'd2', groupId: 'g1', name: '重庆中旅国际', type: '旅行社', contact: '李主任', phone: '023-8821-7890', creditLimit: 300000, usedCredit: 76000, balance: 88000, deposit: 15000, status: '启用', createdAt: '2024-02-20', licenseNo: 'L-CQ-2024-002' },
  { id: 'd3', groupId: 'g1', name: '万州国际旅游', type: '旅行社', contact: '王总', phone: '023-5531-2233', creditLimit: 200000, usedCredit: 0, balance: 15000, deposit: 10000, status: '禁用', createdAt: '2024-03-05', licenseNo: 'L-CQ-2024-003' },
  { id: 'd4', groupId: 'g1', name: '渝东旅游开发', type: '旅行社', contact: '刘经理', phone: '023-7741-5566', creditLimit: 150000, usedCredit: 32000, balance: 27000, deposit: 8000, status: '启用', createdAt: '2024-03-18', licenseNo: 'L-CQ-2024-004' },
  { id: 'd5', groupId: 'g2', name: '宜昌蓝天旅行社', type: '旅行社', contact: '陈总监', phone: '0717-6234-5678', creditLimit: 400000, usedCredit: 210000, balance: 63000, deposit: 30000, status: '启用', createdAt: '2024-01-28', licenseNo: 'L-HB-2024-001' },
  { id: 'd6', groupId: 'g2', name: '武汉中华旅行社', type: '旅行社', contact: '孙主管', phone: '027-8812-3344', creditLimit: 250000, usedCredit: 95000, balance: 18000, deposit: 12000, status: '启用', createdAt: '2024-02-14', licenseNo: 'L-HB-2024-002' },
  { id: 'd7', groupId: 'g2', name: '荆州楚风旅游', type: '旅行社', contact: '赵经理', phone: '0716-8823-4455', creditLimit: 100000, usedCredit: 0, balance: 8500, deposit: 5000, status: '启用', createdAt: '2024-04-01', licenseNo: 'L-HB-2024-003' },
  { id: 'd8', groupId: 'g3', name: '驴妈妈旅游网', type: 'OTA代理', contact: '运营部', phone: '021-5566-7788', creditLimit: 1000000, usedCredit: 358000, balance: 125000, deposit: 50000, status: '启用', createdAt: '2023-12-01', licenseNo: 'L-SH-2023-099' },
  { id: 'd9', groupId: 'g3', name: '途牛旅游网络', type: 'OTA代理', contact: '商务部', phone: '025-8833-9900', creditLimit: 800000, usedCredit: 201000, balance: 98000, deposit: 30000, status: '启用', createdAt: '2023-11-15', licenseNo: 'L-JS-2023-088' },
]

const initApprovals = [
  { id: 'ap1', dealerName: '峡江游轮旅行社', type: '旅行社', contact: '何总', phone: '023-6631-2288', appliedAt: '2026-07-01 14:32', status: '待审核', remark: '' },
  { id: 'ap2', dealerName: '三峡源旅游开发有限公司', type: '旅行社', contact: '周经理', phone: '0717-5521-3344', appliedAt: '2026-07-02 09:15', status: '待审核', remark: '' },
  { id: 'ap3', dealerName: '长航旅游集团', type: '旅行社', contact: '吴总', phone: '023-8841-7722', appliedAt: '2026-06-25 16:40', status: '已通过', remark: '' },
  { id: 'ap4', dealerName: '重庆风情旅行社', type: '旅行社', contact: '郑经理', phone: '023-7732-5566', appliedAt: '2026-06-20 11:08', status: '已通过', remark: '' },
  { id: 'ap5', dealerName: '巴渝文化旅游', type: '旅行社', contact: '钱总监', phone: '023-5521-8800', appliedAt: '2026-06-18 10:55', status: '已通过', remark: '' },
  { id: 'ap6', dealerName: '奉节旅游发展公司', type: '旅行社', contact: '冯经理', phone: '023-4431-6677', appliedAt: '2026-06-15 14:20', status: '已通过', remark: '' },
  { id: 'ap7', dealerName: '白帝城旅游服务', type: '旅行社', contact: '褚总', phone: '023-4422-5533', appliedAt: '2026-06-10 09:30', status: '已通过', remark: '' },
  { id: 'ap8', dealerName: '小渔村休闲旅游', type: '其他', contact: '卫经理', phone: '023-3312-4455', appliedAt: '2026-06-08 15:45', status: '已驳回', remark: '营业执照已过期，请续期后重新提交' },
]

const initCreditRecords = [
  { id: 'cr1', dealerName: '三峡国际旅行社', type: '授信', amount: 500000, operator: '管理员', operatedAt: '2026-06-01 10:00', status: '操作成功', remark: '年度授信额度配置' },
  { id: 'cr2', dealerName: '三峡国际旅行社', type: '在线充值', amount: 50000, operator: '管理员', operatedAt: '2026-06-10 14:30', status: '操作成功', remark: '' },
  { id: 'cr3', dealerName: '宜昌蓝天旅行社', type: '授信', amount: 400000, operator: '管理员', operatedAt: '2026-06-05 09:00', status: '操作成功', remark: '合作升级，提升授信' },
  { id: 'cr4', dealerName: '宜昌蓝天旅行社', type: '线下转账充值', amount: 80000, operator: '管理员', operatedAt: '2026-06-12 11:00', status: '操作成功', remark: '流水号：20260612080012' },
  { id: 'cr5', dealerName: '驴妈妈旅游网', type: '授信', amount: 1000000, operator: '管理员', operatedAt: '2026-05-20 08:30', status: '操作成功', remark: 'OTA渠道专项授信' },
  { id: 'cr6', dealerName: '途牛旅游网络', type: '余额退款', amount: 20000, operator: '管理员', operatedAt: '2026-06-28 16:00', status: '退款中', remark: '退还多余充值余额' },
  { id: 'cr7', dealerName: '重庆中旅国际', type: '线下转账充值', amount: 100000, operator: '管理员', operatedAt: '2026-07-01 10:15', status: '待审核', remark: '流水号：20260701100001' },
]

const initBills = [
  { id: 'b1', month: '2026年6月', dealerName: '三峡国际旅行社', orderCount: 32, totalSales: 189600, totalRefund: 12800, netAmount: 176800, generatedAt: '2026-07-01', pushStatus: '已推送', confirmStatus: '已确认' },
  { id: 'b2', month: '2026年6月', dealerName: '宜昌蓝天旅行社', orderCount: 28, totalSales: 156400, totalRefund: 5200, netAmount: 151200, generatedAt: '2026-07-01', pushStatus: '已推送', confirmStatus: '待确认' },
  { id: 'b3', month: '2026年6月', dealerName: '驴妈妈旅游网', orderCount: 86, totalSales: 523800, totalRefund: 32100, netAmount: 491700, generatedAt: '2026-07-01', pushStatus: '未推送', confirmStatus: '-' },
  { id: 'b4', month: '2026年6月', dealerName: '途牛旅游网络', orderCount: 54, totalSales: 318500, totalRefund: 18700, netAmount: 299800, generatedAt: '2026-07-01', pushStatus: '未推送', confirmStatus: '-' },
  { id: 'b5', month: '2026年5月', dealerName: '三峡国际旅行社', orderCount: 29, totalSales: 168300, totalRefund: 8400, netAmount: 159900, generatedAt: '2026-06-01', pushStatus: '已推送', confirmStatus: '已确认' },
  { id: 'b6', month: '2026年5月', dealerName: '宜昌蓝天旅行社', orderCount: 21, totalSales: 124600, totalRefund: 6200, netAmount: 118400, generatedAt: '2026-06-01', pushStatus: '已推送', confirmStatus: '已确认' },
]

type Dealer = typeof initDealers[number]

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
      <label className="w-24 shrink-0 pt-2 text-sm text-gray-700 text-right">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const selectCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// 添加分销商弹窗
function AddDealerModal({ onClose, onSave }: { onClose: () => void; onSave: (d: Partial<Dealer>) => void }) {
  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [searchKw, setSearchKw] = useState('')
  const [form, setForm] = useState({ name: '', type: '旅行社', contact: '', phone: '', groupId: 'g1', licenseNo: '' })

  return (
    <Modal title="添加分销商" onClose={onClose} width="max-w-xl">
      <div className="mb-4 flex gap-2">
        <button onClick={() => setMode('search')} className={`rounded-lg px-4 py-2 text-sm ${mode === 'search' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>搜索已有账号</button>
        <button onClick={() => setMode('create')} className={`rounded-lg px-4 py-2 text-sm ${mode === 'create' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>新建账号</button>
      </div>
      {mode === 'search' ? (
        <div>
          <p className="mb-3 text-sm text-gray-500">输入分销商名称或账号搜索已注册分销商</p>
          <div className="flex gap-2">
            <input value={searchKw} onChange={e => setSearchKw(e.target.value)} placeholder="输入分销商名称 / 账号" className={inputCls} />
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">搜索</button>
          </div>
          {searchKw && (
            <div className="mt-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => { onSave({ name: searchKw + '旅行社', type: '旅行社', contact: '负责人', phone: '023-0000-0000', groupId: form.groupId, licenseNo: 'L-NEW-001', creditLimit: 0, usedCredit: 0, balance: 0, deposit: 0, status: '启用' }); onClose() }}>
                <div>
                  <div className="text-sm font-medium text-gray-900">{searchKw}旅行社</div>
                  <div className="text-xs text-gray-400">账号：dist_{searchKw.toLowerCase()} · 旅行社</div>
                </div>
                <button className="rounded bg-blue-600 px-3 py-1 text-xs text-white">添加</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-gray-500">为尚未注册的分销商创建账号，创建后自动成为下级分销商</p>
          <div className="space-y-0">
            <FormRow label="分销商名称" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="请输入企业全称" /></FormRow>
            <FormRow label="主体类型" required>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={selectCls}>
                {['旅行社', '酒店', '民宿', '其他', '内部员工'].map(t => <option key={t}>{t}</option>)}
              </select>
            </FormRow>
            <FormRow label="联系人" required><input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className={inputCls} placeholder="请输入联系人姓名" /></FormRow>
            <FormRow label="联系电话" required><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="请输入手机号或座机" /></FormRow>
            <FormRow label="加入分组">
              <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className={selectCls}>
                {GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </FormRow>
            <FormRow label="执照号码"><input value={form.licenseNo} onChange={e => setForm(f => ({ ...f, licenseNo: e.target.value }))} className={inputCls} placeholder="统一社会信用代码或许可证号" /></FormRow>
          </div>
          <div className="mt-2 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">创建成功后，请将生成的账号和初始密码复制并发送给分销商。</div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={() => { if (form.name && form.contact) { onSave({ ...form, creditLimit: 0, usedCredit: 0, balance: 0, deposit: 0, status: '启用' }); onClose() } }} disabled={!form.name || !form.contact} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">创建并添加</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// 授信弹窗
function CreditModal({ dealer, onClose, onSave }: { dealer: Dealer; onClose: () => void; onSave: (limit: number, remark: string) => void }) {
  const [limit, setLimit] = useState(String(dealer.creditLimit / 10000))
  const [remark, setRemark] = useState('')
  return (
    <Modal title={`配置授信 — ${dealer.name}`} onClose={onClose}>
      <div className="space-y-0">
        <FormRow label="当前授信"><span className="text-sm text-gray-700">¥{(dealer.creditLimit / 10000).toFixed(2)}万</span></FormRow>
        <FormRow label="已用额度"><span className="text-sm text-orange-600">¥{(dealer.usedCredit / 10000).toFixed(2)}万</span></FormRow>
        <FormRow label="新授信额度" required>
          <div className="flex items-center gap-2">
            <input type="number" value={limit} onChange={e => setLimit(e.target.value)} className={inputCls} placeholder="请输入万元数" />
            <span className="shrink-0 text-sm text-gray-500">万元</span>
          </div>
        </FormRow>
        <FormRow label="备注"><textarea value={remark} onChange={e => setRemark(e.target.value)} rows={2} className={inputCls} placeholder="如：年度授信额度调整" /></FormRow>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button onClick={() => { onSave(parseFloat(limit) * 10000, remark); onClose() }} disabled={!limit || isNaN(Number(limit))} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">保存授信</button>
      </div>
    </Modal>
  )
}

// 充值弹窗
function RechargeModal({ dealer, onClose, onSave }: { dealer: Dealer; onClose: () => void; onSave: (type: string, amount: number) => void }) {
  const [mode, setMode] = useState<'online' | 'offline'>('online')
  const [amount, setAmount] = useState('')
  const [flowNo, setFlowNo] = useState('')
  const [showQR, setShowQR] = useState(false)

  if (showQR) {
    return (
      <Modal title="扫码付款" onClose={onClose}>
        <div className="text-center">
          <p className="mb-4 text-sm text-gray-600">请将付款二维码发送给分销商 <strong>{dealer.name}</strong> 扫码付款</p>
          <div className="mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-xl bg-gray-100 text-6xl">📱</div>
          <p className="text-lg font-bold text-blue-700">¥{parseFloat(amount).toLocaleString()}</p>
          <p className="mt-1 text-xs text-gray-400">等待支付中…</p>
          <div className="mt-4 flex justify-center gap-3">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={() => { onSave('在线充值', parseFloat(amount)); onClose() }} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">模拟支付成功</button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={`充值 — ${dealer.name}`} onClose={onClose}>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setMode('online')} className={`rounded-lg px-4 py-2 text-sm ${mode === 'online' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>在线充值</button>
        <button onClick={() => setMode('offline')} className={`rounded-lg px-4 py-2 text-sm ${mode === 'offline' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>线下转账充值</button>
      </div>
      <div className="space-y-0">
        <FormRow label="当前余额"><span className="text-sm text-gray-700">¥{dealer.balance.toLocaleString()}</span></FormRow>
        <FormRow label="充值金额" required>
          <div className="flex items-center gap-2">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} placeholder="请输入充值金额" />
            <span className="shrink-0 text-sm text-gray-500">元</span>
          </div>
        </FormRow>
        {mode === 'offline' && (
          <FormRow label="银行流水号" required><input value={flowNo} onChange={e => setFlowNo(e.target.value)} className={inputCls} placeholder="请输入转账流水号" /></FormRow>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button
          onClick={() => { if (mode === 'online') { setShowQR(true) } else { onSave('线下转账充值', parseFloat(amount)); onClose() } }}
          disabled={!amount || (mode === 'offline' && !flowNo)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mode === 'online' ? '生成付款码' : '确认充值'}
        </button>
      </div>
    </Modal>
  )
}

// 退款弹窗
function RefundModal({ dealer, onClose, onSave }: { dealer: Dealer; onClose: () => void; onSave: () => void }) {
  const [refundType, setRefundType] = useState('余额退款')
  const [amount, setAmount] = useState('')
  const [remark, setRemark] = useState('')
  const maxAmount = refundType === '余额退款' ? dealer.balance : dealer.deposit
  return (
    <Modal title={`发起退款 — ${dealer.name}`} onClose={onClose}>
      <div className="space-y-0">
        <FormRow label="退款类型" required>
          <select value={refundType} onChange={e => setRefundType(e.target.value)} className={selectCls}>
            <option>余额退款</option>
            <option>质保金退款</option>
          </select>
        </FormRow>
        <FormRow label="可退金额"><span className="text-sm text-gray-700">¥{maxAmount.toLocaleString()}</span></FormRow>
        <FormRow label="退款金额" required>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} max={maxAmount} className={inputCls} placeholder={`最多可退 ¥${maxAmount.toLocaleString()}`} />
        </FormRow>
        <FormRow label="退款说明" required><textarea value={remark} onChange={e => setRemark(e.target.value)} rows={2} className={inputCls} placeholder="请说明退款原因" /></FormRow>
      </div>
      <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">退款申请提交后需经审批，审批通过后由财务中心执行对公转账。</div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button onClick={() => { onSave(); onClose() }} disabled={!amount || !remark} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">提交退款申请</button>
      </div>
    </Modal>
  )
}

// 禁用弹窗
function DisableModal({ dealer, onClose, onSave }: { dealer: Dealer; onClose: () => void; onSave: (reason: string, duration: string) => void }) {
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('30天')
  return (
    <Modal title={`禁用分销商 — ${dealer.name}`} onClose={onClose}>
      <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">禁用后，该分销商将无法购买本平台产品，其他平台不受影响。</div>
      <div className="space-y-0">
        <FormRow label="禁用时长" required>
          <select value={duration} onChange={e => setDuration(e.target.value)} className={selectCls}>
            {['7天', '15天', '30天', '90天', '永久'].map(d => <option key={d}>{d}</option>)}
          </select>
        </FormRow>
        <FormRow label="禁用原因" required><textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className={inputCls} placeholder="请说明禁用原因，将通知分销商" /></FormRow>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button onClick={() => { onSave(reason, duration); onClose() }} disabled={!reason} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50">确认禁用</button>
      </div>
    </Modal>
  )
}

// 详情弹窗
function DetailModal({ dealer, onClose }: { dealer: Dealer; onClose: () => void }) {
  const available = (dealer.creditLimit - dealer.usedCredit) + dealer.balance
  return (
    <Modal title="分销商详情" onClose={onClose} width="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: '分销商名称', value: dealer.name },
            { label: '主体类型', value: dealer.type },
            { label: '联系人', value: dealer.contact },
            { label: '联系电话', value: dealer.phone },
            { label: '执照号码', value: dealer.licenseNo },
            { label: '合作状态', value: dealer.status },
            { label: '加入时间', value: dealer.createdAt },
          ].map(item => (
            <div key={item.label} className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '总授信额度', value: `¥${(dealer.creditLimit / 10000).toFixed(1)}万`, color: 'text-blue-700' },
            { label: '已用授信', value: `¥${(dealer.usedCredit / 10000).toFixed(1)}万`, color: 'text-orange-600' },
            { label: '充值余额', value: `¥${(dealer.balance / 10000).toFixed(1)}万`, color: 'text-gray-900' },
            { label: '质保金', value: `¥${(dealer.deposit / 10000).toFixed(1)}万`, color: 'text-gray-500' },
            { label: '可用额度', value: `¥${(available / 10000).toFixed(1)}万`, color: 'text-blue-700' },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-gray-200 px-3 py-2.5">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`mt-0.5 text-sm font-semibold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">关闭</button>
      </div>
    </Modal>
  )
}

// ======================== Tab: 合作分销商 ========================

function TabDealers({ dealers, setDealers, setCreditRecords }: {
  dealers: typeof initDealers
  setDealers: React.Dispatch<React.SetStateAction<typeof initDealers>>
  setCreditRecords: React.Dispatch<React.SetStateAction<typeof initCreditRecords>>
}) {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [keyword, setKeyword] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [creditTarget, setCreditTarget] = useState<Dealer | null>(null)
  const [rechargeTarget, setRechargeTarget] = useState<Dealer | null>(null)
  const [refundTarget, setRefundTarget] = useState<Dealer | null>(null)
  const [disableTarget, setDisableTarget] = useState<Dealer | null>(null)
  const [detailTarget, setDetailTarget] = useState<Dealer | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const filtered = dealers.filter(d =>
    (selectedGroup === 'all' || d.groupId === selectedGroup) &&
    (d.name.includes(keyword) || d.contact.includes(keyword))
  )
  const fmt = (n: number) => `¥${(n / 10000).toFixed(1)}万`

  return (
    <div className="flex gap-4">
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}

      {/* 左侧分组 */}
      <div className="w-44 shrink-0 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-3 py-2.5 text-xs font-semibold text-gray-500">分销商分组</div>
        <div className="p-1.5 space-y-0.5">
          <button onClick={() => setSelectedGroup('all')} className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm ${selectedGroup === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
            <span>全部</span><span className="text-xs text-gray-400">{dealers.length}</span>
          </button>
          {GROUPS.map(g => (
            <button key={g.id} onClick={() => setSelectedGroup(g.id)} className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm ${selectedGroup === g.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
              <span>{g.name}</span><span className="text-xs text-gray-400">{dealers.filter(d => d.groupId === g.id).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 右侧列表 */}
      <div className="flex-1 min-w-0">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索名称/联系人" className="h-9 w-56 rounded-lg border border-gray-300 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowAdd(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />添加分销商
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">分销商名称</th>
                <th className="px-4 py-3 text-left font-medium">类型</th>
                <th className="px-4 py-3 text-left font-medium">联系人</th>
                <th className="px-4 py-3 text-right font-medium">总授信</th>
                <th className="px-4 py-3 text-right font-medium">已用</th>
                <th className="px-4 py-3 text-right font-medium">余额</th>
                <th className="px-4 py-3 text-right font-medium text-blue-700">可用额度</th>
                <th className="px-4 py-3 text-center font-medium">状态</th>
                <th className="px-4 py-3 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(d => {
                const available = (d.creditLimit - d.usedCredit) + d.balance
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{d.name}</div>
                      <div className="text-xs text-gray-400">{d.licenseNo}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.type}</td>
                    <td className="px-4 py-3">
                      <div>{d.contact}</div>
                      <div className="text-xs text-gray-400">{d.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(d.creditLimit)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{fmt(d.usedCredit)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(d.balance)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">{fmt(available)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${d.status === '启用' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
                        <button onClick={() => setDetailTarget(d)} className="text-blue-600 hover:text-blue-700">详情</button>
                        <button onClick={() => setCreditTarget(d)} className="text-gray-600 hover:text-gray-700">授信</button>
                        <button onClick={() => setRechargeTarget(d)} className="text-gray-600 hover:text-gray-700">充值</button>
                        <button onClick={() => setRefundTarget(d)} className="text-gray-600 hover:text-gray-700">退款</button>
                        {d.status === '启用'
                          ? <button onClick={() => setDisableTarget(d)} className="text-red-500 hover:text-red-600">禁用</button>
                          : <button onClick={() => { setDealers(prev => prev.map(x => x.id === d.id ? { ...x, status: '启用' } : x)); showToast(`已启用 ${d.name}`) }} className="text-green-600 hover:text-green-700">启用</button>
                        }
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 弹窗 */}
      {showAdd && <AddDealerModal onClose={() => setShowAdd(false)} onSave={d => { setDealers(prev => [...prev, { id: `d${Date.now()}`, groupId: d.groupId ?? 'g1', name: d.name ?? '', type: d.type ?? '旅行社', contact: d.contact ?? '', phone: d.phone ?? '', creditLimit: 0, usedCredit: 0, balance: 0, deposit: 0, status: '启用', createdAt: new Date().toISOString().slice(0, 10), licenseNo: d.licenseNo ?? '' }]); showToast('分销商添加成功') }} />}
      {creditTarget && <CreditModal dealer={creditTarget} onClose={() => setCreditTarget(null)} onSave={(limit, remark) => { setDealers(prev => prev.map(x => x.id === creditTarget.id ? { ...x, creditLimit: limit } : x)); setCreditRecords(prev => [{ id: `cr${Date.now()}`, dealerName: creditTarget.name, type: '授信', amount: limit, operator: '管理员', operatedAt: new Date().toLocaleString('zh-CN'), status: '操作成功', remark }, ...prev]); showToast('授信配置成功') }} />}
      {rechargeTarget && <RechargeModal dealer={rechargeTarget} onClose={() => setRechargeTarget(null)} onSave={(type, amount) => { setDealers(prev => prev.map(x => x.id === rechargeTarget.id ? { ...x, balance: x.balance + amount } : x)); setCreditRecords(prev => [{ id: `cr${Date.now()}`, dealerName: rechargeTarget.name, type, amount, operator: '管理员', operatedAt: new Date().toLocaleString('zh-CN'), status: '操作成功', remark: '' }, ...prev]); showToast('充值成功') }} />}
      {refundTarget && <RefundModal dealer={refundTarget} onClose={() => setRefundTarget(null)} onSave={() => { setCreditRecords(prev => [{ id: `cr${Date.now()}`, dealerName: refundTarget.name, type: '余额退款', amount: 0, operator: '管理员', operatedAt: new Date().toLocaleString('zh-CN'), status: '待审核', remark: '退款申请待审批' }, ...prev]); showToast('退款申请已提交，等待审批') }} />}
      {disableTarget && <DisableModal dealer={disableTarget} onClose={() => setDisableTarget(null)} onSave={() => { setDealers(prev => prev.map(x => x.id === disableTarget.id ? { ...x, status: '禁用' } : x)); showToast(`已禁用 ${disableTarget.name}`) }} />}
      {detailTarget && <DetailModal dealer={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  )
}

// ======================== Tab: 合作审核 ========================

function TabApprovals() {
  const [filter, setFilter] = useState('全部')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [records, setRecords] = useState(initApprovals)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const opts = ['全部', '待审核', '已通过', '已驳回']
  const pendingCount = records.filter(r => r.status === '待审核').length
  const filtered = records.filter(r => filter === '全部' || r.status === filter)

  return (
    <div>
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <div className="mb-4 flex gap-2">
        {opts.map(o => (
          <button key={o} onClick={() => setFilter(o)} className={`rounded-lg px-3 py-1.5 text-sm ${filter === o ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            {o}{o === '待审核' && pendingCount > 0 && <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{pendingCount}</span>}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">申请分销商</th>
              <th className="px-4 py-3 text-left font-medium">主体类型</th>
              <th className="px-4 py-3 text-left font-medium">联系人</th>
              <th className="px-4 py-3 text-left font-medium">申请时间</th>
              <th className="px-4 py-3 text-center font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">备注</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.dealerName}</td>
                <td className="px-4 py-3 text-gray-600">{r.type}</td>
                <td className="px-4 py-3"><div>{r.contact}</div><div className="text-xs text-gray-400">{r.phone}</div></td>
                <td className="px-4 py-3 text-gray-500">{r.appliedAt}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === '待审核' ? 'bg-yellow-50 text-yellow-700' : r.status === '已通过' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.remark || '-'}</td>
                <td className="px-4 py-3 text-center">
                  {r.status === '待审核' && (
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setRecords(prev => prev.map(x => x.id === r.id ? { ...x, status: '已通过' } : x)); showToast(`已通过 ${r.dealerName} 的合作申请`) }} className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"><Check className="h-3 w-3" />通过</button>
                      <button onClick={() => { setRejectId(r.id); setRejectReason('') }} className="inline-flex items-center gap-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"><X className="h-3 w-3" />驳回</button>
                    </div>
                  )}
                  {r.status !== '待审核' && <button className="text-xs text-blue-600 hover:text-blue-700">查看详情</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rejectId && (
        <Modal title="填写驳回原因" onClose={() => setRejectId(null)}>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="请填写驳回原因，将推送给分销商..." rows={4} className={inputCls} />
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setRejectId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={() => { setRecords(prev => prev.map(r => r.id === rejectId ? { ...r, status: '已驳回', remark: rejectReason } : r)); setRejectId(null); showToast('已驳回申请') }} disabled={!rejectReason.trim()} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50">确认驳回</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ======================== Tab: 充值授信管理 ========================

function TabCredit({ dealers, setDealers, creditRecords, setCreditRecords }: {
  dealers: typeof initDealers
  setDealers: React.Dispatch<React.SetStateAction<typeof initDealers>>
  creditRecords: typeof initCreditRecords
  setCreditRecords: React.Dispatch<React.SetStateAction<typeof initCreditRecords>>
}) {
  const [creditTarget, setCreditTarget] = useState<Dealer | null>(null)
  const [rechargeTarget, setRechargeTarget] = useState<Dealer | null>(null)
  const [refundTarget, setRefundTarget] = useState<Dealer | null>(null)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const fmt = (n: number) => `¥${(n / 10000).toFixed(2)}万`
  const active = dealers.filter(d => d.status === '启用')

  return (
    <div>
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: '总授信额度', value: `¥${(active.reduce((s, d) => s + d.creditLimit, 0) / 10000).toFixed(1)}万`, color: 'text-blue-700' },
          { label: '已用授信', value: `¥${(active.reduce((s, d) => s + d.usedCredit, 0) / 10000).toFixed(1)}万`, color: 'text-orange-600' },
          { label: '充值余额合计', value: `¥${(active.reduce((s, d) => s + d.balance, 0) / 10000).toFixed(1)}万`, color: 'text-green-700' },
          { label: '可用额度合计', value: `¥${(active.reduce((s, d) => s + (d.creditLimit - d.usedCredit) + d.balance, 0) / 10000).toFixed(1)}万`, color: 'text-gray-900' },
        ].map(card => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`mt-1 text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">分销商</th>
              <th className="px-4 py-3 text-right font-medium">总授信</th>
              <th className="px-4 py-3 text-right font-medium">已用</th>
              <th className="px-4 py-3 text-right font-medium">剩余授信</th>
              <th className="px-4 py-3 text-right font-medium">充值余额</th>
              <th className="px-4 py-3 text-right font-medium">质保金</th>
              <th className="px-4 py-3 text-right font-medium text-blue-700">可用额度</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {active.map(d => {
              const remaining = d.creditLimit - d.usedCredit
              const available = remaining + d.balance
              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="font-medium text-gray-900">{d.name}</div><div className="text-xs text-gray-400">{d.type}</div></td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(d.creditLimit)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{fmt(d.usedCredit)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(remaining)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(d.balance)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{fmt(d.deposit)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-700">{fmt(available)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <button onClick={() => setCreditTarget(d)} className="inline-flex items-center gap-1 rounded border border-blue-300 px-2 py-1 text-blue-600 hover:bg-blue-50"><CreditCard className="h-3 w-3" />授信</button>
                      <button onClick={() => setRechargeTarget(d)} className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50">充值</button>
                      <button onClick={() => setRefundTarget(d)} className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50">退款</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {creditTarget && <CreditModal dealer={creditTarget} onClose={() => setCreditTarget(null)} onSave={(limit, remark) => { setDealers(prev => prev.map(x => x.id === creditTarget.id ? { ...x, creditLimit: limit } : x)); setCreditRecords(prev => [{ id: `cr${Date.now()}`, dealerName: creditTarget.name, type: '授信', amount: limit, operator: '管理员', operatedAt: new Date().toLocaleString('zh-CN'), status: '操作成功', remark }, ...prev]); showToast('授信配置成功') }} />}
      {rechargeTarget && <RechargeModal dealer={rechargeTarget} onClose={() => setRechargeTarget(null)} onSave={(type, amount) => { setDealers(prev => prev.map(x => x.id === rechargeTarget.id ? { ...x, balance: x.balance + amount } : x)); setCreditRecords(prev => [{ id: `cr${Date.now()}`, dealerName: rechargeTarget.name, type, amount, operator: '管理员', operatedAt: new Date().toLocaleString('zh-CN'), status: '操作成功', remark: '' }, ...prev]); showToast('充值成功') }} />}
      {refundTarget && <RefundModal dealer={refundTarget} onClose={() => setRefundTarget(null)} onSave={() => showToast('退款申请已提交，等待审批')} />}
    </div>
  )
}

// ======================== Tab: 操作记录 ========================

function TabCreditRecords({ creditRecords }: { creditRecords: typeof initCreditRecords }) {
  const statusColor: Record<string, string> = {
    '操作成功': 'bg-green-50 text-green-700',
    '退款中': 'bg-yellow-50 text-yellow-700',
    '待审核': 'bg-blue-50 text-blue-700',
    '操作失败': 'bg-red-50 text-red-600',
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">分销商</th>
            <th className="px-4 py-3 text-left font-medium">操作类型</th>
            <th className="px-4 py-3 text-right font-medium">金额</th>
            <th className="px-4 py-3 text-left font-medium">操作人</th>
            <th className="px-4 py-3 text-left font-medium">操作时间</th>
            <th className="px-4 py-3 text-center font-medium">状态</th>
            <th className="px-4 py-3 text-left font-medium">备注</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {creditRecords.map(r => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{r.dealerName}</td>
              <td className="px-4 py-3 text-gray-700">{r.type}</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">¥{r.amount.toLocaleString()}</td>
              <td className="px-4 py-3 text-gray-600">{r.operator}</td>
              <td className="px-4 py-3 text-gray-500">{r.operatedAt}</td>
              <td className="px-4 py-3 text-center"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[r.status] ?? 'bg-gray-100 text-gray-500'}`}>{r.status}</span></td>
              <td className="px-4 py-3 text-xs text-gray-500">{r.remark || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ======================== Tab: 账单 ========================

function TabBills() {
  const [bills, setBills] = useState(initBills)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const pushColor: Record<string, string> = { '已推送': 'bg-green-50 text-green-700', '未推送': 'bg-gray-100 text-gray-500' }
  const confirmColor: Record<string, string> = { '已确认': 'bg-blue-50 text-blue-700', '待确认': 'bg-yellow-50 text-yellow-700', '-': 'bg-gray-100 text-gray-400' }
  return (
    <div>
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      <div className="mb-3 flex items-center gap-3">
        <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none"><option>2026年6月</option><option>2026年5月</option></select>
        <button className="h-9 rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700" onClick={() => showToast('已批量推送未推送账单')}>批量推送</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">账单月份</th>
              <th className="px-4 py-3 text-left font-medium">分销商</th>
              <th className="px-4 py-3 text-right font-medium">核销订单数</th>
              <th className="px-4 py-3 text-right font-medium">总销售额</th>
              <th className="px-4 py-3 text-right font-medium">退票金额</th>
              <th className="px-4 py-3 text-right font-medium">净结算额</th>
              <th className="px-4 py-3 text-center font-medium">推送状态</th>
              <th className="px-4 py-3 text-center font-medium">确认状态</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bills.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{b.month}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{b.dealerName}</td>
                <td className="px-4 py-3 text-right text-gray-700">{b.orderCount}</td>
                <td className="px-4 py-3 text-right text-gray-700">¥{b.totalSales.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-red-500">-¥{b.totalRefund.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">¥{b.netAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-center"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pushColor[b.pushStatus]}`}>{b.pushStatus}</span></td>
                <td className="px-4 py-3 text-center"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${confirmColor[b.confirmStatus]}`}>{b.confirmStatus}</span></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <button onClick={() => showToast('账单下载中…')} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"><Download className="h-3 w-3" />下载</button>
                    {b.pushStatus === '未推送' && <button onClick={() => { setBills(prev => prev.map(x => x.id === b.id ? { ...x, pushStatus: '已推送' } : x)); showToast('推送成功') }} className="text-gray-700 hover:text-gray-900">推送</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ======================== 主页面 ========================

const TABS = [
  { key: 'dealers', label: '合作分销商' },
  { key: 'approvals', label: '合作审核', badge: true },
  { key: 'credit', label: '充值授信管理' },
  { key: 'credit_records', label: '操作记录' },
  { key: 'bills', label: '分销商账单' },
]

export default function CooperationManagementPage() {
  const [activeTab, setActiveTab] = useState('dealers')
  const [dealers, setDealers] = useState(initDealers)
  const [creditRecords, setCreditRecords] = useState(initCreditRecords)
  const pendingCount = 2

  return (
    <div>
      <PageHeader title="合作管理" description="管理合作分销商信息、合作审核及授信充值等业务。" />
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
              {tab.label}
              {tab.badge && pendingCount > 0 && <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{pendingCount}</span>}
            </button>
          ))}
        </div>
      </div>
      {activeTab === 'dealers' && <TabDealers dealers={dealers} setDealers={setDealers} setCreditRecords={setCreditRecords} />}
      {activeTab === 'approvals' && <TabApprovals />}
      {activeTab === 'credit' && <TabCredit dealers={dealers} setDealers={setDealers} creditRecords={creditRecords} setCreditRecords={setCreditRecords} />}
      {activeTab === 'credit_records' && <TabCreditRecords creditRecords={creditRecords} />}
      {activeTab === 'bills' && <TabBills />}
    </div>
  )
}
