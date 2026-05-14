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
      for (const key of ['type', 'category', 'region', 'brand', 'org', 'roleId', 'dictCode', 'level', 'shipClass', 'starLevel'] as const) {
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
import { ports, attractions, routes, users, roles, menus, dictionaries, dashboardData, ships, products, voyages, voyageTemplates, tickets, facilities, rooms, voyageInventories, voyagePrices } from './data'
import type { Port, Attraction, Route, User, Role, Menu, Dictionary, Product, Ship, ShipForm, Voyage, VoyageTemplate, Ticket, ShipFacility, Room, VoyageInventory, VoyagePrice } from '@/types'

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
      filtered = filtered.filter((r) => r.createdAt.slice(0, 10) >= params.dateFrom)
    }
    if (params.dateTo && typeof params.dateTo === 'string') {
      filtered = filtered.filter((r) => r.createdAt.slice(0, 10) <= params.dateTo)
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
    if (params.direction && params.direction !== 'all') {
      // 通过关联产品判断上下水
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
