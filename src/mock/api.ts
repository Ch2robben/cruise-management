import { delay, generateId } from '@/utils/format'
import type { SearchParams, PaginatedResult, PricingRow } from '@/types'

// ========== 通用 CRUD API 工厂 ==========
interface CrudConfig<T> {
  searchFields: (keyof T & string)[]
  dateField?: string
}

export function createCrudApi<T extends { id: string; status: string }>(
  data: T[],
  config: CrudConfig<T>
) {
  let dataset = [...data]

  // 模拟网络延迟
  const wait = () => delay(300)

  // 过滤
  function filterItems(items: T[], params: Record<string, unknown>): T[] {
    return items.filter((item) => {
      // 关键词搜索
      if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
        const kw = params.keyword.toLowerCase()
        const match = config.searchFields.some((field) => {
          const val = item[field as keyof T]
          return typeof val === 'string' && val.toLowerCase().includes(kw)
        })
        if (!match) return false
      }

      // 状态筛选
      if (params.status && params.status !== 'all') {
        if (item.status !== params.status) return false
      }

      // 分类筛选 (通用)
      for (const key of ['type', 'category', 'region', 'brand', 'org', 'roleId', 'dictCode', 'level'] as const) {
        if (params[key] && params[key] !== 'all') {
          const itemVal = (item as Record<string, unknown>)[key]
          if (itemVal !== params[key]) return false
        }
      }

      // 港口筛选
      if (params.portId && params.portId !== 'all') {
        const itemVal = (item as Record<string, unknown>)['portId']
        if (itemVal !== params.portId) return false
      }

      // 日期范围
      if (config.dateField) {
        const dateStr = (item as Record<string, unknown>)[config.dateField] as string
        if (dateStr) {
          const datePart = dateStr.slice(0, 10)
          if (params.dateFrom && typeof params.dateFrom === 'string' && datePart < params.dateFrom) return false
          if (params.dateTo && typeof params.dateTo === 'string' && datePart > params.dateTo) return false
        }
      }

      // 数值区间
      for (const key of ['minPrice', 'maxPrice'] as const) {
        if (params[key] !== undefined && params[key] !== '') {
          // skip - handle in derived APIs
        }
      }

      return true
    })
  }

  return {
    // 获取当前数据集引用 (用于其他API模块)
    getData: () => dataset,

    // 分页查询
    async list(params: SearchParams = {}): Promise<PaginatedResult<T>> {
      await wait()
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const filtered = filterItems(dataset, params as Record<string, unknown>)
      const total = filtered.length
      const start = (page - 1) * pageSize
      const paged = filtered.slice(start, start + pageSize)
      return { data: paged, total, page, pageSize }
    },

    // 获取单条
    async getById(id: string): Promise<T | undefined> {
      await wait()
      return dataset.find((item) => item.id === id)
    },

    // 新增
    async create(item: Omit<T, 'id'>): Promise<T> {
      await wait()
      const newItem = { ...item, id: generateId() } as T
      dataset.unshift(newItem)
      return newItem
    },

    // 编辑
    async update(id: string, updates: Partial<T>): Promise<T | undefined> {
      await wait()
      const idx = dataset.findIndex((item) => item.id === id)
      if (idx === -1) return undefined
      dataset[idx] = { ...dataset[idx], ...updates }
      return dataset[idx]
    },

    // 删除
    async remove(id: string): Promise<boolean> {
      await wait()
      const idx = dataset.findIndex((item) => item.id === id)
      if (idx === -1) return false
      dataset.splice(idx, 1)
      return true
    },

    // 启用/禁用切换
    async toggleStatus(id: string): Promise<T | undefined> {
      await wait()
      const idx = dataset.findIndex((item) => item.id === id)
      if (idx === -1) return undefined
      dataset[idx] = {
        ...dataset[idx],
        status: dataset[idx].status === 'enabled' ? 'disabled' : 'enabled',
      }
      return dataset[idx]
    },
  }
}

// ========== 导出各模块 API ==========
import {
  ports,
  attractions,
  routes,
  users,
  roles,
  menus,
  dictionaries,
  dashboardData,
  ships,
  products,
  voyages,
  voyageTemplates,
  tickets,
  facilities,
  rooms,
  voyageInventories,
  voyagePrices,
  dealers,
  cabinHolds,
  charterOrders,
  complaintTickets,
  customerProfiles,
  marketingCampaigns,
  reconciliationBatches,
  dataReports,
} from './data'
import type {
  Port,
  Attraction,
  Route,
  User,
  Role,
  Menu,
  Dictionary,
  Product,
  Ship,
  ShipForm,
  Voyage,
  VoyageTemplate,
  Ticket,
  ShipFacility,
  Room,
  VoyageInventory,
  VoyagePrice,
  Dealer,
  CabinHold,
  CharterOrder,
  ComplaintTicket,
  ComplaintRecord,
  CustomerProfile,
  MarketingCampaign,
  ReconciliationBatch,
  DataReportEntry,
} from '@/types'

export const shipApi = createCrudApi<Ship>(ships, {
  searchFields: ['name', 'level'],
})

export const portApi = createCrudApi<Port>(ports, {
  searchFields: ['name', 'nameEn', 'code'],
})

export const attractionApi = createCrudApi<Attraction>(attractions, {
  searchFields: ['name', 'nameEn', 'description'],
})

export const userApi = createCrudApi<User>(users, {
  searchFields: ['account', 'name', 'phone'],
})

export const roleApi = createCrudApi<Role>(roles, {
  searchFields: ['code', 'name', 'description'],
})

export const menuApi = createCrudApi<Menu>(menus, {
  searchFields: ['name', 'code'],
})

export const dictionaryApi = createCrudApi<Dictionary>(dictionaries, {
  searchFields: ['dictCode', 'dictName', 'itemName'],
})

// ========== 航线专用 API ==========
export const routeApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<Route>> {
    await delay(300)
    let filtered = [...routes]

    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(kw) ||
          r.code.toLowerCase().includes(kw) ||
          r.ports.toLowerCase().includes(kw)
      )
    }

    if (params.type && params.type !== 'all') {
      filtered = filtered.filter((r) => r.type === params.type)
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((r) => r.status === params.status)
    }

    if (params.portId && params.portId !== 'all') {
      filtered = filtered.filter((r) =>
        r.stops.some((s) => s.portId === params.portId)
      )
    }

    if (params.dateFrom && typeof params.dateFrom === 'string') {
      const dateFrom = params.dateFrom
      filtered = filtered.filter((r) => r.createdAt.slice(0, 10) >= dateFrom)
    }
    if (params.dateTo && typeof params.dateTo === 'string') {
      const dateTo = params.dateTo
      filtered = filtered.filter((r) => r.createdAt.slice(0, 10) <= dateTo)
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const total = filtered.length
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)
    return { data: paged, total, page, pageSize }
  },

  async getById(id: string): Promise<Route | undefined> {
    await delay(300)
    return routes.find((r) => r.id === id)
  },

  async create(item: Omit<Route, 'id'>): Promise<Route> {
    await delay(300)
    const newItem = { ...item, id: generateId() } as Route
    routes.unshift(newItem)
    return newItem
  },

  async update(id: string, updates: Partial<Route>): Promise<Route | undefined> {
    await delay(300)
    const idx = routes.findIndex((r) => r.id === id)
    if (idx === -1) return undefined
    routes[idx] = { ...routes[idx], ...updates }
    return routes[idx]
  },

  async remove(id: string): Promise<boolean> {
    await delay(300)
    const idx = routes.findIndex((r) => r.id === id)
    if (idx === -1) return false
    routes.splice(idx, 1)
    return true
  },

  async toggleStatus(id: string): Promise<Route | undefined> {
    await delay(300)
    const idx = routes.findIndex((r) => r.id === id)
    if (idx === -1) return undefined
    routes[idx] = {
      ...routes[idx],
      status: routes[idx].status === 'enabled' ? 'disabled' : 'enabled',
    }
    return routes[idx]
  },
}

// ========== 产品专用 API ==========
export const productApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<Product>> {
    await delay(300)
    let filtered = [...products]

    // 关键词：游轮名称
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          p.shipName.toLowerCase().includes(kw)
      )
    }

    // 船舶等级筛选
    if (params.shipLevel && params.shipLevel !== 'all') {
      filtered = filtered.filter((p) => p.shipLevel === params.shipLevel)
    }

    // 航线筛选
    if (params.routeId && params.routeId !== 'all') {
      filtered = filtered.filter((p) => p.routeId === params.routeId)
    }

    // 上下水类型筛选
    if (params.routeType && params.routeType !== 'all') {
      filtered = filtered.filter((p) => p.routeType === params.routeType)
    }

    // 状态筛选
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((p) => p.status === params.status)
    }

    // 航行里程范围筛选
    if (params.minMileage !== undefined && params.minMileage !== '') {
      filtered = filtered.filter((p) => p.mileage >= Number(params.minMileage))
    }
    if (params.maxMileage !== undefined && params.maxMileage !== '') {
      filtered = filtered.filter((p) => p.mileage <= Number(params.maxMileage))
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const total = filtered.length
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)
    return { data: paged, total, page, pageSize }
  },

  async getById(id: string): Promise<Product | undefined> {
    await delay(300)
    return products.find((p) => p.id === id)
  },

  async create(item: Omit<Product, 'id'>): Promise<Product> {
    await delay(300)
    const newItem = { ...item, id: generateId() } as Product
    products.unshift(newItem)
    return newItem
  },

  async update(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    await delay(300)
    const idx = products.findIndex((p) => p.id === id)
    if (idx === -1) return undefined
    products[idx] = { ...products[idx], ...updates }
    return products[idx]
  },

  async remove(id: string): Promise<boolean> {
    await delay(300)
    const idx = products.findIndex((p) => p.id === id)
    if (idx === -1) return false
    products.splice(idx, 1)
    return true
  },

  async toggleStatus(id: string): Promise<Product | undefined> {
    await delay(300)
    const idx = products.findIndex((p) => p.id === id)
    if (idx === -1) return undefined
    products[idx] = {
      ...products[idx],
      status: products[idx].status === 'enabled' ? 'disabled' : 'enabled',
    }
    return products[idx]
  },

  async updatePricing(id: string, pricing: PricingRow[]): Promise<Product | undefined> {
    await delay(300)
    const idx = products.findIndex((p) => p.id === id)
    if (idx === -1) return undefined
    products[idx] = { ...products[idx], pricing }
    return products[idx]
  },
}

// ========== 数据看板 API ==========
export const voyageApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<Voyage>> {
    await delay(300)
    let filtered = [...voyages]
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((v) => v.voyageNo.toLowerCase().includes(kw) || v.productName.toLowerCase().includes(kw))
    }
    if (params.status && params.status !== 'all') filtered = filtered.filter((v) => v.status === params.status)
    if (params.direction && params.direction !== 'all') filtered = filtered.filter((v) => v.direction === params.direction)
    if (params.routeId && params.routeId !== 'all') filtered = filtered.filter((v) => v.routeId === params.routeId)
    if (params.shipId && params.shipId !== 'all') filtered = filtered.filter((v) => v.shipId === params.shipId)
    if (params.dateFrom && typeof params.dateFrom === 'string') filtered = filtered.filter((v) => v.startDate >= params.dateFrom!)
    if (params.dateTo && typeof params.dateTo === 'string') filtered = filtered.filter((v) => v.startDate <= params.dateTo!)
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const total = filtered.length
    const start = (page - 1) * pageSize
    return { data: filtered.slice(start, start + pageSize), total, page, pageSize }
  },
  async getById(id: string): Promise<Voyage | undefined> { await delay(300); return voyages.find((v) => v.id === id) },
  async remove(id: string): Promise<boolean> { await delay(300); const i = voyages.findIndex((v) => v.id === id); if (i === -1) return false; voyages.splice(i, 1); return true },
  async batchUpdateStatus(ids: string[], status: string): Promise<void> {
    await delay(300)
    for (const id of ids) {
      const i = voyages.findIndex((v) => v.id === id)
      if (i !== -1) voyages[i] = { ...voyages[i], status: status as Voyage['status'] }
    }
  },
}

export const templateApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<VoyageTemplate>> {
    await delay(300)
    let filtered = [...voyageTemplates]
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((t) => t.code.toLowerCase().includes(kw) || t.name.toLowerCase().includes(kw))
    }
    if (params.status && params.status !== 'all') filtered = filtered.filter((t) => t.status === params.status)
    if (params.shipName && params.shipName !== 'all') filtered = filtered.filter((t) => t.shipName === params.shipName)
    if (params.direction && params.direction !== 'all') {
      filtered = filtered.filter((t) => products.find((p) => p.id === t.productId)?.routeType === params.direction)
    }
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const total = filtered.length
    const start = (page - 1) * pageSize
    return { data: filtered.slice(start, start + pageSize), total, page, pageSize }
  },
  async getById(id: string): Promise<VoyageTemplate | undefined> { await delay(300); return voyageTemplates.find((t) => t.id === id) },
  async create(item: Omit<VoyageTemplate, 'id'>): Promise<VoyageTemplate> { await delay(300); const n = { ...item, id: generateId() } as VoyageTemplate; voyageTemplates.unshift(n); return n },
  async update(id: string, u: Partial<VoyageTemplate>): Promise<VoyageTemplate | undefined> { await delay(300); const i = voyageTemplates.findIndex((t) => t.id === id); if (i === -1) return undefined; voyageTemplates[i] = { ...voyageTemplates[i], ...u }; return voyageTemplates[i] },
  async remove(id: string): Promise<boolean> { await delay(300); const i = voyageTemplates.findIndex((t) => t.id === id); if (i === -1) return false; voyageTemplates.splice(i, 1); return true },
  async toggleStatus(id: string): Promise<VoyageTemplate | undefined> {
    await delay(300); const i = voyageTemplates.findIndex((t) => t.id === id)
    if (i === -1) return undefined
    const cur = voyageTemplates[i].status
    voyageTemplates[i] = { ...voyageTemplates[i], status: cur === 'enabled' ? 'disabled' : cur === 'disabled' ? 'enabled' : cur }
    return voyageTemplates[i]
  },
}

export const ticketApi = createCrudApi<Ticket>(tickets, { searchFields: ['name'] })

export const facilityApi = createCrudApi<ShipFacility>(facilities, { searchFields: ['code', 'name'] })

export const roomApi = {
  ...createCrudApi<Room>(rooms, { searchFields: ['roomNo', 'cabinTypeName'] }),
  async batchCreate(items: Omit<Room, 'id'>[]): Promise<void> {
    await delay(300)
    for (const item of items) {
      rooms.unshift({ ...item, id: generateId() } as Room)
    }
  },
}

export const inventoryApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<VoyageInventory>> {
    await delay(300)
    let filtered = [...voyageInventories]
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((i) => i.voyageNo.toLowerCase().includes(kw))
    }
    if (params.voyageId && params.voyageId !== 'all') filtered = filtered.filter((i) => i.voyageId === params.voyageId)
    if (params.shipId && params.shipId !== 'all') filtered = filtered.filter((i) => voyages.find((v) => v.id === i.voyageId)?.shipId === params.shipId)
    const page = params.page || 1; const pageSize = params.pageSize || 10
    const total = filtered.length; const start = (page - 1) * pageSize
    return { data: filtered.slice(start, start + pageSize), total, page, pageSize }
  },
  async batchUpdate(ids: string[], updates: Partial<VoyageInventory>): Promise<void> {
    await delay(300)
    for (const id of ids) { const i = voyageInventories.findIndex((inv) => inv.id === id); if (i !== -1) voyageInventories[i] = { ...voyageInventories[i], ...updates } }
  },
}

export const priceApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<VoyagePrice>> {
    await delay(300)
    let filtered = [...voyagePrices]
    if (params.voyageId && params.voyageId !== 'all') filtered = filtered.filter((p) => p.voyageId === params.voyageId)
    const page = params.page || 1; const pageSize = params.pageSize || 50
    const total = filtered.length; const start = (page - 1) * pageSize
    return { data: filtered.slice(start, start + pageSize), total, page, pageSize }
  },
  async update(id: string, updates: Partial<VoyagePrice>): Promise<void> {
    await delay(300)
    const i = voyagePrices.findIndex((p) => p.id === id); if (i !== -1) voyagePrices[i] = { ...voyagePrices[i], ...updates }
  },
  async batchCreate(items: Omit<VoyagePrice, 'id'>[]): Promise<void> {
    await delay(300); voyagePrices.unshift(...items.map((item) => ({ ...item, id: generateId() } as VoyagePrice)))
  },
}

export const dashboardApi = {
  async get(): Promise<typeof dashboardData> {
    await delay(400)
    return { ...dashboardData }
  },
}

function paginate<T>(filtered: T[], params: SearchParams = {}, defaultPageSize = 10): PaginatedResult<T> {
  const page = params.page || 1
  const pageSize = params.pageSize || defaultPageSize
  const total = filtered.length
  const start = (page - 1) * pageSize
  return { data: filtered.slice(start, start + pageSize), total, page, pageSize }
}

// ========== 经销商 API ==========
export const dealerApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<Dealer>> {
    await delay(300)
    let filtered = [...dealers]
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(kw) || item.code.toLowerCase().includes(kw))
    }
    if (params.status && params.status !== 'all') filtered = filtered.filter((item) => item.status === params.status)
    if (params.level && params.level !== 'all') filtered = filtered.filter((item) => item.level === params.level)
    if (params.channelType && params.channelType !== 'all') filtered = filtered.filter((item) => item.channelTypes.includes(params.channelType as Dealer['channelTypes'][number]))
    if (params.region && params.region !== 'all') filtered = filtered.filter((item) => item.region === params.region)
    return paginate(filtered, params)
  },
  async getById(id: string): Promise<Dealer | undefined> { await delay(300); return dealers.find((item) => item.id === id) },
  async create(item: Omit<Dealer, 'id'>): Promise<Dealer> { await delay(300); const next = { ...item, id: generateId() } as Dealer; dealers.unshift(next); return next },
  async update(id: string, updates: Partial<Dealer>): Promise<Dealer | undefined> {
    await delay(300)
    const index = dealers.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    dealers[index] = { ...dealers[index], ...updates }
    return dealers[index]
  },
  async remove(id: string): Promise<boolean> {
    await delay(300)
    const index = dealers.findIndex((item) => item.id === id)
    if (index === -1) return false
    dealers.splice(index, 1)
    return true
  },
  async toggleStatus(id: string): Promise<Dealer | undefined> {
    await delay(300)
    const index = dealers.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    dealers[index] = { ...dealers[index], status: dealers[index].status === 'cooperating' ? 'terminated' : 'cooperating' }
    return dealers[index]
  },
}

// ========== 锁舱记录 API ==========
export const cabinHoldApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<CabinHold>> {
    await delay(300)
    let filtered = [...cabinHolds]
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((item) => item.dealerName.toLowerCase().includes(kw) || item.productName.toLowerCase().includes(kw))
    }
    if (params.status && params.status !== 'all') filtered = filtered.filter((item) => item.status === params.status)
    if (params.dealerId && params.dealerId !== 'all') filtered = filtered.filter((item) => item.dealerId === params.dealerId)
    if (params.routeName && params.routeName !== 'all') filtered = filtered.filter((item) => item.routeName === params.routeName)
    if (params.dateFrom && typeof params.dateFrom === 'string') { const dateFrom = params.dateFrom; filtered = filtered.filter((item) => item.voyageDate >= dateFrom) }
    if (params.dateTo && typeof params.dateTo === 'string') { const dateTo = params.dateTo; filtered = filtered.filter((item) => item.voyageDate <= dateTo) }
    return paginate(filtered, params)
  },
  async getById(id: string): Promise<CabinHold | undefined> { await delay(300); return cabinHolds.find((item) => item.id === id) },
  async create(item: Omit<CabinHold, 'id'>): Promise<CabinHold> { await delay(300); const next = { ...item, id: generateId() } as CabinHold; cabinHolds.unshift(next); return next },
  async update(id: string, updates: Partial<CabinHold>): Promise<CabinHold | undefined> {
    await delay(300)
    const index = cabinHolds.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    cabinHolds[index] = { ...cabinHolds[index], ...updates }
    return cabinHolds[index]
  },
  async release(id: string, reason: string): Promise<CabinHold | undefined> {
    await delay(300)
    const index = cabinHolds.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    cabinHolds[index] = { ...cabinHolds[index], status: 'released', releaseReason: reason, updatedAt: new Date().toISOString() }
    return cabinHolds[index]
  },
  async remove(id: string): Promise<boolean> {
    await delay(300)
    const index = cabinHolds.findIndex((item) => item.id === id)
    if (index === -1) return false
    cabinHolds.splice(index, 1)
    return true
  },
}

// ========== 包船订单 API ==========
export const charterOrderApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<CharterOrder>> {
    await delay(300)
    let filtered = [...charterOrders]
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((item) => item.orderNo.toLowerCase().includes(kw) || item.companyName.toLowerCase().includes(kw))
    }
    if (params.status && params.status !== 'all') filtered = filtered.filter((item) => item.status === params.status)
    if (params.reservationType && params.reservationType !== 'all') filtered = filtered.filter((item) => item.reservationType === params.reservationType)
    if (params.dateFrom && typeof params.dateFrom === 'string') { const dateFrom = params.dateFrom; filtered = filtered.filter((item) => item.useDate >= dateFrom) }
    if (params.dateTo && typeof params.dateTo === 'string') { const dateTo = params.dateTo; filtered = filtered.filter((item) => item.useDate <= dateTo) }
    return paginate(filtered, params)
  },
  async getById(id: string): Promise<CharterOrder | undefined> { await delay(300); return charterOrders.find((item) => item.id === id) },
  async create(item: Omit<CharterOrder, 'id'>): Promise<CharterOrder> { await delay(300); const next = { ...item, id: generateId() } as CharterOrder; charterOrders.unshift(next); return next },
  async update(id: string, updates: Partial<CharterOrder>): Promise<CharterOrder | undefined> {
    await delay(300)
    const index = charterOrders.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    charterOrders[index] = { ...charterOrders[index], ...updates }
    return charterOrders[index]
  },
  async accept(id: string, remark: string): Promise<CharterOrder | undefined> {
    return this.update(id, { status: 'accepted', internalRemark: remark, updatedAt: new Date().toISOString() })
  },
  async reject(id: string, reason: string): Promise<CharterOrder | undefined> {
    return this.update(id, { status: 'cancelled', rejectReason: reason, updatedAt: new Date().toISOString() })
  },
  async sign(id: string): Promise<CharterOrder | undefined> {
    return this.update(id, { status: 'signed', updatedAt: new Date().toISOString() })
  },
  async registerCollection(id: string, amount: number, voucher: string): Promise<CharterOrder | undefined> {
    await delay(300)
    const index = charterOrders.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    const current = charterOrders[index]
    const nextReceived = current.receivedDepositAmount + amount
    const nextCollections = current.collections.concat({
      id: generateId(),
      amount,
      feeItem: '收款登记',
      voucher,
      collectedAt: new Date().toISOString(),
      collectedBy: '当前用户',
    })
    charterOrders[index] = {
      ...current,
      collections: nextCollections,
      receivedDepositAmount: nextReceived,
      depositStatus: nextReceived >= current.depositAmount ? 'paid' : 'partial',
      updatedAt: new Date().toISOString(),
    }
    return charterOrders[index]
  },
  async cancel(id: string, reason: string): Promise<CharterOrder | undefined> {
    return this.update(id, { status: 'cancelled', rejectReason: reason, updatedAt: new Date().toISOString() })
  },
}

// ========== 客诉工单 API ==========
export const complaintApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<ComplaintTicket>> {
    await delay(300)
    let filtered = [...complaintTickets]
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((item) => item.customerName.toLowerCase().includes(kw) || item.orderNo.toLowerCase().includes(kw) || item.ticketNo.toLowerCase().includes(kw))
    }
    if (params.status && params.status !== 'all') filtered = filtered.filter((item) => item.status === params.status)
    if (params.type && params.type !== 'all') filtered = filtered.filter((item) => item.type === params.type)
    if (params.priority && params.priority !== 'all') filtered = filtered.filter((item) => item.priority === params.priority)
    if (params.dateFrom && typeof params.dateFrom === 'string') { const dateFrom = params.dateFrom; filtered = filtered.filter((item) => item.createdAt.slice(0, 10) >= dateFrom) }
    if (params.dateTo && typeof params.dateTo === 'string') { const dateTo = params.dateTo; filtered = filtered.filter((item) => item.createdAt.slice(0, 10) <= dateTo) }
    return paginate(filtered, params)
  },
  async getById(id: string): Promise<ComplaintTicket | undefined> { await delay(300); return complaintTickets.find((item) => item.id === id) },
  async create(item: Omit<ComplaintTicket, 'id'>): Promise<ComplaintTicket> { await delay(300); const next = { ...item, id: generateId() } as ComplaintTicket; complaintTickets.unshift(next); return next },
  async update(id: string, updates: Partial<ComplaintTicket>): Promise<ComplaintTicket | undefined> {
    await delay(300)
    const index = complaintTickets.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    complaintTickets[index] = { ...complaintTickets[index], ...updates }
    return complaintTickets[index]
  },
  async assign(id: string, assigneeId: string, assigneeName: string): Promise<ComplaintTicket | undefined> {
    return this.update(id, { assigneeId, assigneeName, updatedAt: new Date().toISOString() })
  },
  async appendRecord(id: string, record: Omit<ComplaintRecord, 'id'>): Promise<ComplaintTicket | undefined> {
    await delay(300)
    const index = complaintTickets.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    const current = complaintTickets[index]
    complaintTickets[index] = {
      ...current,
      status: record.status,
      records: current.records.concat({ ...record, id: generateId() }),
      updatedAt: new Date().toISOString(),
    }
    return complaintTickets[index]
  },
  async close(id: string, opinion: string): Promise<ComplaintTicket | undefined> {
    return this.appendRecord(id, {
      opinion,
      internalRemark: '关闭工单',
      status: 'completed',
      operator: '当前用户',
      operatedAt: new Date().toISOString(),
    })
  },
}

// ========== 客户档案 API ==========
export const customerProfileApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<CustomerProfile>> {
    await delay(300)
    let filtered = [...customerProfiles]
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(kw) || item.phone.includes(kw) || item.idCard.toLowerCase().includes(kw))
    }
    if (params.level && params.level !== 'all') filtered = filtered.filter((item) => item.level === params.level)
    if (params.sourceChannel && params.sourceChannel !== 'all') filtered = filtered.filter((item) => item.sourceChannel === params.sourceChannel)
    if (params.tag && params.tag !== 'all') filtered = filtered.filter((item) => item.tags.includes(params.tag as string))
    if (params.dateFrom && typeof params.dateFrom === 'string') { const dateFrom = params.dateFrom; filtered = filtered.filter((item) => item.lastVoyageDate >= dateFrom) }
    if (params.dateTo && typeof params.dateTo === 'string') { const dateTo = params.dateTo; filtered = filtered.filter((item) => item.lastVoyageDate <= dateTo) }
    return paginate(filtered, params)
  },
  async getById(id: string): Promise<CustomerProfile | undefined> { await delay(300); return customerProfiles.find((item) => item.id === id) },
  async update(id: string, updates: Partial<CustomerProfile>): Promise<CustomerProfile | undefined> {
    await delay(300)
    const index = customerProfiles.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    customerProfiles[index] = { ...customerProfiles[index], ...updates }
    return customerProfiles[index]
  },
}

// ========== 营销活动 API ==========
export const campaignApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<MarketingCampaign>> {
    await delay(300)
    let filtered = [...marketingCampaigns]
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(kw))
    }
    if (params.status && params.status !== 'all') filtered = filtered.filter((item) => item.status === params.status)
    if (params.type && params.type !== 'all') filtered = filtered.filter((item) => item.type === params.type)
    if (params.dateFrom && typeof params.dateFrom === 'string') { const dateFrom = params.dateFrom; filtered = filtered.filter((item) => item.startDate >= dateFrom) }
    if (params.dateTo && typeof params.dateTo === 'string') { const dateTo = params.dateTo; filtered = filtered.filter((item) => item.endDate <= dateTo) }
    return paginate(filtered, params)
  },
  async getById(id: string): Promise<MarketingCampaign | undefined> { await delay(300); return marketingCampaigns.find((item) => item.id === id) },
  async create(item: Omit<MarketingCampaign, 'id'>): Promise<MarketingCampaign> { await delay(300); const next = { ...item, id: generateId() } as MarketingCampaign; marketingCampaigns.unshift(next); return next },
  async update(id: string, updates: Partial<MarketingCampaign>): Promise<MarketingCampaign | undefined> {
    await delay(300)
    const index = marketingCampaigns.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    marketingCampaigns[index] = { ...marketingCampaigns[index], ...updates }
    return marketingCampaigns[index]
  },
  async start(id: string): Promise<MarketingCampaign | undefined> {
    return this.update(id, { status: 'ongoing', updatedAt: new Date().toISOString() })
  },
  async stop(id: string): Promise<MarketingCampaign | undefined> {
    return this.update(id, { status: 'ended', updatedAt: new Date().toISOString() })
  },
}

// ========== 对账批次 API ==========
export const reconciliationApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<ReconciliationBatch>> {
    await delay(300)
    let filtered = [...reconciliationBatches]
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((item) => item.batchNo.toLowerCase().includes(kw) || item.dealerName.toLowerCase().includes(kw))
    }
    if (params.status && params.status !== 'all') filtered = filtered.filter((item) => item.status === params.status)
    if (params.channelType && params.channelType !== 'all') filtered = filtered.filter((item) => item.channelType === params.channelType)
    if (params.dateFrom && typeof params.dateFrom === 'string') { const dateFrom = params.dateFrom; filtered = filtered.filter((item) => item.reconcileDate >= dateFrom) }
    if (params.dateTo && typeof params.dateTo === 'string') { const dateTo = params.dateTo; filtered = filtered.filter((item) => item.reconcileDate <= dateTo) }
    return paginate(filtered, params)
  },
  async getById(id: string): Promise<ReconciliationBatch | undefined> { await delay(300); return reconciliationBatches.find((item) => item.id === id) },
  async create(item: Omit<ReconciliationBatch, 'id'>): Promise<ReconciliationBatch> { await delay(300); const next = { ...item, id: generateId() } as ReconciliationBatch; reconciliationBatches.unshift(next); return next },
  async update(id: string, updates: Partial<ReconciliationBatch>): Promise<ReconciliationBatch | undefined> {
    await delay(300)
    const index = reconciliationBatches.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    reconciliationBatches[index] = { ...reconciliationBatches[index], ...updates }
    return reconciliationBatches[index]
  },
  async markDifferenceHandled(id: string, diffId: string, remark: string): Promise<ReconciliationBatch | undefined> {
    await delay(300)
    const index = reconciliationBatches.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    const current = reconciliationBatches[index]
    const differences = current.differences.map((diff) => diff.id === diffId ? { ...diff, handled: true, remark } : diff)
    const allHandled = differences.every((diff) => diff.handled)
    reconciliationBatches[index] = {
      ...current,
      differences,
      status: current.diffCount === 0 ? 'reconciled' : allHandled ? 'diff_resolved' : 'diff_pending',
      updatedAt: new Date().toISOString(),
    }
    return reconciliationBatches[index]
  },
}

// ========== 报表中心 API ==========
export const reportApi = {
  async list(params: SearchParams = {}): Promise<PaginatedResult<DataReportEntry>> {
    await delay(300)
    let filtered = [...dataReports]
    if (params.category && params.category !== 'all') filtered = filtered.filter((item) => item.category === params.category)
    if (params.period && params.period !== 'all') filtered = filtered.filter((item) => item.period === params.period)
    if (params.keyword && typeof params.keyword === 'string' && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((item) => item.routeName.toLowerCase().includes(kw) || item.productName.toLowerCase().includes(kw) || item.dealerName.toLowerCase().includes(kw))
    }
    if (params.dateFrom && typeof params.dateFrom === 'string') { const dateFrom = params.dateFrom; filtered = filtered.filter((item) => item.dateLabel >= dateFrom) }
    if (params.dateTo && typeof params.dateTo === 'string') { const dateTo = params.dateTo; filtered = filtered.filter((item) => item.dateLabel <= dateTo) }
    return paginate(filtered, params, 12)
  },
}
