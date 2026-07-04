/**
 * 航行时间配置 Store
 * 存储相邻码头对之间的上水/下水航行时间（分钟）
 * key: `${fromPortId}->${toPortId}`（始终按下水方向，即上游→下游的顺序）
 */
export interface NavigationTimePair {
  fromPortId: string
  toPortId: string
  fromPortName: string
  toPortName: string
  downstreamMin: number  // 下水（顺流）航行分钟
  upstreamMin: number    // 上水（逆流）航行分钟
}

// key: `${fromPortId}->${toPortId}` 上游→下游方向
const store = new Map<string, NavigationTimePair>()

function makeKey(fromPortId: string, toPortId: string) {
  return `${fromPortId}->${toPortId}`
}

export const navigationTimeStore = {
  getAll(): NavigationTimePair[] {
    return Array.from(store.values())
  },

  get(fromPortId: string, toPortId: string): NavigationTimePair | undefined {
    return store.get(makeKey(fromPortId, toPortId))
  },

  set(pair: NavigationTimePair): void {
    store.set(makeKey(pair.fromPortId, pair.toPortId), pair)
  },

  setMany(pairs: NavigationTimePair[]): void {
    for (const pair of pairs) {
      store.set(makeKey(pair.fromPortId, pair.toPortId), pair)
    }
  },

  /** 将 Port 列表中的 prevPierUpstreamMin / nextPierDownstreamMin 预填入 store */
  seedFromPorts(ports: import('@/types').Port[]): void {
    // 按 riverSort 排序后，找相邻对
    const sorted = [...ports]
      .filter((p) => p.riverSort != null)
      .sort((a, b) => (a.riverSort ?? 0) - (b.riverSort ?? 0))

    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i]
      const to = sorted[i + 1]
      const key = makeKey(from.id, to.id)
      if (!store.has(key)) {
        store.set(key, {
          fromPortId: from.id,
          toPortId: to.id,
          fromPortName: from.name,
          toPortName: to.name,
          downstreamMin: from.nextPierDownstreamMin ?? 0,
          upstreamMin: to.prevPierUpstreamMin ?? 0,
        })
      }
    }
  },
}
