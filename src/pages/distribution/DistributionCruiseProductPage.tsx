import { Fragment, useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronRight, RefreshCw, RotateCcw, Search, X } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import FormDialog from '@/components/common/FormDialog'
import { formatCurrency } from '@/utils/format'
import {
  distributionCruiseShipOptions,
  filterDistributionCruiseProducts,
  type DistCruiseCalendarDayPrice,
  type DistCruiseChannelSetting,
  type DistCruiseProduct,
  type DistCruiseShelfStatus,
  type DistCruiseTicket,
} from '@/mock/distributionCruiseProducts'

type PriceVisibility = {
  cost: boolean
  retail: boolean
  market: boolean
  window: boolean
}

function cloneChannels(channels: DistCruiseChannelSetting[]) {
  return channels.map((item) => ({ ...item }))
}

function cloneCalendar(prices: DistCruiseCalendarDayPrice[]) {
  return prices.map((item) => ({ ...item }))
}

export default function DistributionCruiseProductPage() {
  const [shipName, setShipName] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [shelfStatus, setShelfStatus] = useState<DistCruiseShelfStatus>('on_sale')
  const [applied, setApplied] = useState({ shipName: 'all', keyword: '', shelfStatus: 'on_sale' as DistCruiseShelfStatus })
  const [products, setProducts] = useState<DistCruiseProduct[]>(() => filterDistributionCruiseProducts({ shelfStatus: 'on_sale' }))
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)

  const [channelTicket, setChannelTicket] = useState<{ productId: string; ticket: DistCruiseTicket } | null>(null)
  const [channelDraft, setChannelDraft] = useState<DistCruiseChannelSetting[]>([])

  const [calendarTicket, setCalendarTicket] = useState<{ productId: string; productName: string; ticket: DistCruiseTicket } | null>(null)
  const [calendarDraft, setCalendarDraft] = useState<DistCruiseCalendarDayPrice[]>([])
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [distributeInput, setDistributeInput] = useState('')
  const [priceVisibility, setPriceVisibility] = useState<PriceVisibility>({
    cost: true,
    retail: true,
    market: false,
    window: false,
  })
  const [calendarMonth] = useState({ year: 2026, month: 8 })

  const filtered = useMemo(
    () => products.filter((item) => {
      if (item.shelfStatus !== applied.shelfStatus) return false
      if (applied.shipName !== 'all' && item.shipName !== applied.shipName) return false
      const kw = applied.keyword.trim().toLowerCase()
      if (!kw) return true
      return [item.name, item.shipName, item.category, ...item.tickets.map((t) => t.name)].some((v) => v.toLowerCase().includes(kw))
    }),
    [applied, products],
  )

  const handleSearch = () => {
    setApplied({ shipName, keyword, shelfStatus })
  }

  const handleReset = () => {
    setShipName('all')
    setKeyword('')
    setApplied({ shipName: 'all', keyword: '', shelfStatus })
  }

  const handleSync = () => {
    setSyncing(true)
    window.setTimeout(() => {
      setProducts(filterDistributionCruiseProducts({}))
      setSyncing(false)
      window.alert('产品同步完成（原型模拟）')
    }, 600)
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const updateTicket = (productId: string, ticketId: string, updater: (ticket: DistCruiseTicket) => DistCruiseTicket) => {
    setProducts((current) => current.map((product) => {
      if (product.id !== productId) return product
      return {
        ...product,
        tickets: product.tickets.map((ticket) => (ticket.id === ticketId ? updater(ticket) : ticket)),
      }
    }))
  }

  const openChannel = (productId: string, ticket: DistCruiseTicket) => {
    setChannelTicket({ productId, ticket })
    setChannelDraft(cloneChannels(ticket.channels))
  }

  const saveChannel = () => {
    if (!channelTicket) return
    updateTicket(channelTicket.productId, channelTicket.ticket.id, (ticket) => ({
      ...ticket,
      channels: cloneChannels(channelDraft),
      settlePrice: channelDraft.find((item) => item.key === 'distribute')?.settlePrice ?? ticket.settlePrice,
    }))
    setChannelTicket(null)
  }

  const openCalendar = (productId: string, productName: string, ticket: DistCruiseTicket) => {
    setCalendarTicket({ productId, productName, ticket })
    setCalendarDraft(cloneCalendar(ticket.calendarPrices))
    setSelectedDates([])
    setDistributeInput('')
  }

  const toggleDate = (date: string) => {
    setSelectedDates((current) => (current.includes(date) ? current.filter((item) => item !== date) : [...current, date]))
  }

  const saveCalendar = () => {
    if (!calendarTicket) return
    const value = Number(distributeInput)
    const nextDraft = calendarDraft.map((day) => {
      if (!selectedDates.includes(day.date)) return day
      if (!Number.isFinite(value) || distributeInput.trim() === '') return day
      return { ...day, distributePrice: value }
    })
    updateTicket(calendarTicket.productId, calendarTicket.ticket.id, (ticket) => ({
      ...ticket,
      calendarPrices: cloneCalendar(nextDraft),
    }))
    setCalendarDraft(nextDraft)
    setCalendarTicket(null)
  }

  const restoreCalendar = () => {
    if (!calendarTicket) return
    setCalendarDraft(cloneCalendar(calendarTicket.ticket.calendarPrices))
    setSelectedDates([])
    setDistributeInput('')
  }

  const daysInMonth = new Date(calendarMonth.year, calendarMonth.month, 0).getDate()
  const firstWeekday = new Date(calendarMonth.year, calendarMonth.month - 1, 1).getDay()
  const calendarCells = [
    ...Array.from({ length: firstWeekday }, () => null as number | null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]

  return (
    <div>
      <PageHeader title="游轮产品">
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          产品同步
        </button>
      </PageHeader>

      <div className="border-b border-gray-200 bg-white px-9 py-6">
        <div className="mb-3 text-sm font-medium text-gray-700">游轮</div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">船名</span>
            <select
              value={shipName}
              onChange={(event) => setShipName(event.target.value)}
              className="h-10 w-44 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="all">全部</option>
              {distributionCruiseShipOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">产品名称</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="请输入"
              className="h-10 w-56 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Search className="h-4 w-4" />
            查询
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-9">
        <div className="flex gap-8">
          {([
            { key: 'on_sale', label: '出售中' },
            { key: 'off_shelf', label: '已下架' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setShelfStatus(tab.key)
                setApplied((current) => ({ ...current, shelfStatus: tab.key }))
              }}
              className={`border-b-2 py-3 text-sm font-medium ${
                shelfStatus === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full min-w-[1280px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              {['产品', '产品分类', '排序', '操作'].map((title) => (
                <th key={title} className="border-b border-r border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 last:border-r-0">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center text-sm text-gray-400">暂无数据</td>
              </tr>
            ) : filtered.map((product) => {
              const expanded = expandedIds.includes(product.id)
              return (
                <Fragment key={product.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="border-b border-r border-gray-200 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <button type="button" onClick={() => toggleExpand(product.id)} className="mt-1 rounded p-0.5 text-gray-500 hover:bg-gray-100">
                          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-blue-50 text-xs font-medium text-blue-600">
                          游轮
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900">{product.name}</span>
                            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] text-red-600">{product.tag}</span>
                          </div>
                          <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                            <div>票类：{product.tickets.length} 种</div>
                            <div>供应商：{product.supplier}</div>
                            <div>来源：{product.source} · {product.shipName}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-700">{product.category}</td>
                    <td className="border-b border-r border-gray-200 px-4 py-4 tabular-nums text-gray-700">{product.sort}</td>
                    <td className="border-b border-gray-200 px-4 py-4">
                      <button
                        type="button"
                        onClick={() => window.alert(`已刷新「${product.name}」（原型模拟）`)}
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        刷新
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={4} className="border-b border-gray-200 bg-gray-50 p-4">
                        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                          <table className="w-full min-w-[1400px] text-xs">
                            <thead>
                              <tr className="bg-gray-50">
                                {['票ID', '票名称', '出发', '到达', '舱房', '票种', '成本价', '零售价', '门市价', '结算价', '状态', '排序', '操作'].map((title) => (
                                  <th key={title} className="border-b border-r border-gray-200 px-3 py-2.5 text-left font-medium text-gray-500 last:border-r-0">
                                    {title}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {product.tickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5 font-mono text-gray-600">{ticket.id}</td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5 text-gray-800">{ticket.name}</td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5">{ticket.departPort}</td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5">{ticket.arrivePort}</td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5">{ticket.cabinName}</td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5">{ticket.ticketType}</td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5 tabular-nums">{formatCurrency(ticket.costPrice)}</td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5 tabular-nums">{formatCurrency(ticket.retailPrice)}</td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5 tabular-nums">{formatCurrency(ticket.marketPrice)}</td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5 tabular-nums">{formatCurrency(ticket.settlePrice)}</td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5">
                                    <span className={`rounded px-1.5 py-0.5 ${ticket.status === 'on' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {ticket.status === 'on' ? '上架' : '下架'}
                                    </span>
                                  </td>
                                  <td className="border-b border-r border-gray-200 px-3 py-2.5 tabular-nums">{ticket.sort}</td>
                                  <td className="border-b border-gray-200 px-3 py-2.5">
                                    <div className="flex flex-wrap gap-2">
                                      <button type="button" onClick={() => openChannel(product.id, ticket)} className="text-blue-600 hover:underline">可售渠道</button>
                                      <button type="button" onClick={() => openCalendar(product.id, product.name, ticket)} className="text-blue-600 hover:underline">日历结算价设置</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <FormDialog
        open={!!channelTicket}
        title="渠道设置"
        width="max-w-2xl"
        onCancel={() => setChannelTicket(null)}
        onSubmit={saveChannel}
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500">渠道</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500">是否可售</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500">结算价</th>
            </tr>
          </thead>
          <tbody>
            {channelDraft.map((channel, index) => (
              <tr key={channel.key}>
                <td className="border border-gray-200 px-4 py-3 text-gray-800">{channel.name}</td>
                <td className="border border-gray-200 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setChannelDraft((current) => current.map((item, i) => (i === index ? { ...item, sellable: !item.sellable } : item)))}
                    className={`relative h-6 w-11 rounded-full transition ${channel.sellable ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${channel.sellable ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    value={channel.settlePrice}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      setChannelDraft((current) => current.map((item, i) => (i === index ? { ...item, settlePrice: Number.isFinite(value) ? value : 0 } : item)))
                    }}
                    className="h-9 w-32 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </FormDialog>

      {calendarTicket && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[3vh]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCalendarTicket(null)} />
          <div className="relative mx-4 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">日历结算价配置</h3>
              <button type="button" onClick={() => setCalendarTicket(null)} className="rounded p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 px-6 py-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span>产品</span>
                <select className="h-9 rounded-md border border-gray-300 px-3 text-sm" value={calendarTicket.productName} disabled>
                  <option>{calendarTicket.productName}</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span>票类</span>
                <select className="h-9 max-w-xs rounded-md border border-gray-300 px-3 text-sm" value={calendarTicket.ticket.id} disabled>
                  <option value={calendarTicket.ticket.id}>{calendarTicket.ticket.name}</option>
                </select>
              </label>
              {([
                ['cost', '显示成本价'],
                ['retail', '显示零售价'],
                ['market', '显示门市价'],
                ['window', '显示窗口价'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={priceVisibility[key]}
                    onChange={(event) => setPriceVisibility((current) => ({ ...current, [key]: event.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="min-w-0 flex-1 overflow-auto p-6">
                <div className="mb-3 text-sm font-medium text-gray-800">
                  {calendarMonth.year}年{calendarMonth.month}月
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map((label) => (
                    <div key={label} className="py-1 text-center text-xs text-gray-400">{label}</div>
                  ))}
                  {calendarCells.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} />
                    const date = `2026-08-${String(day).padStart(2, '0')}`
                    const price = calendarDraft.find((item) => item.date === date)
                    const selected = selectedDates.includes(date)
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => toggleDate(date)}
                        className={`relative min-h-[92px] rounded-md border p-2 text-left transition ${
                          selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        {selected && (
                          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                        <div className="text-sm font-medium text-gray-800">{String(day).padStart(2, '0')}</div>
                        <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
                          {priceVisibility.cost && <div>成本价: {price?.costPrice ?? 0}</div>}
                          {priceVisibility.retail && <div>零售价: {price?.retailPrice ?? 0}</div>}
                          {priceVisibility.market && <div>门市价: {price?.marketPrice ?? 0}</div>}
                          {priceVisibility.window && <div>窗口价: {price?.windowPrice ?? 0}</div>}
                          <div className="font-medium text-blue-700">分销预定: {price?.distributePrice ?? 0}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="w-72 shrink-0 border-l border-gray-200 bg-gray-50 p-5">
                <div className="text-sm font-semibold text-gray-900">设置价格</div>
                <div className="mt-2 text-xs text-gray-500">已选天数: {selectedDates.length}</div>
                <label className="mt-5 flex flex-col gap-1.5">
                  <span className="text-xs text-gray-500">分销预定</span>
                  <div className="flex items-center gap-2">
                    <input
                      value={distributeInput}
                      onChange={(event) => setDistributeInput(event.target.value)}
                      placeholder="请输入"
                      className="h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">元</span>
                  </div>
                </label>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={saveCalendar}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={restoreCalendar}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-sm text-blue-700 hover:bg-blue-100"
                  >
                    还原
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
