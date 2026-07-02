import type { Port } from '@/types'
import { getPortMileagePosition, yangtzeMileageAnchors } from '@/mock/yangtzeRiverMileage'

const DOWNSTREAM_SPEED_KMH = 18
const UPSTREAM_SPEED_KMH = 15

export interface RouteStopLike {
  portId: string
  portName: string
  sailTime: string
  type: 'start' | 'middle' | 'end' | string
}

/** 按码头 ID 或名称解析码头 */
export function resolveStopPort(
  stop: Pick<RouteStopLike, 'portId' | 'portName'>,
  ports: Port[],
): Port | undefined {
  if (stop.portId) return ports.find((port) => port.id === stop.portId)
  const key = stop.portName.trim()
  if (!key) return undefined
  return ports.find(
    (port) =>
      port.name === key
      || port.name.includes(key)
      || port.city === key
      || key.includes(port.city),
  )
}

function getMileageChainPortIds(): string[] {
  const seen = new Set<string>()
  return yangtzeMileageAnchors
    .filter((anchor) => {
      if (seen.has(anchor.portId)) return false
      seen.add(anchor.portId)
      return true
    })
    .sort((a, b) => {
      const posA = getPortMileagePosition(a.portId) ?? 0
      const posB = getPortMileagePosition(b.portId) ?? 0
      return posA - posB || a.riverSort - b.riverSort
    })
    .map((anchor) => anchor.portId)
}

function estimateLegMinutes(fromPort: Port, toPort: Port, direction: 'upstream' | 'downstream'): number {
  const fromKm = getPortMileagePosition(fromPort.id)
  const toKm = getPortMileagePosition(toPort.id)
  if (fromKm == null || toKm == null) return 0
  const km = Math.abs(toKm - fromKm)
  const speed = direction === 'downstream' ? DOWNSTREAM_SPEED_KMH : UPSTREAM_SPEED_KMH
  return Math.round((km / speed) * 60)
}

function legMinutesBetweenPorts(
  fromPort: Port,
  toPort: Port,
  direction: 'upstream' | 'downstream',
): number {
  if (direction === 'downstream' && fromPort.nextPierDownstreamMin) {
    return fromPort.nextPierDownstreamMin
  }
  if (direction === 'upstream' && toPort.prevPierUpstreamMin) {
    return toPort.prevPierUpstreamMin
  }
  return estimateLegMinutes(fromPort, toPort, direction)
}

/** 两停靠点之间，按航行方向累加途经码头的航行时间（分钟） */
export function computeLegSailMinutes(
  fromStop: Pick<RouteStopLike, 'portId' | 'portName'>,
  toStop: Pick<RouteStopLike, 'portId' | 'portName'>,
  direction: 'upstream' | 'downstream',
  ports: Port[],
): number {
  const fromPort = resolveStopPort(fromStop, ports)
  const toPort = resolveStopPort(toStop, ports)
  if (!fromPort || !toPort || fromPort.id === toPort.id) return 0

  const chain = getMileageChainPortIds()
  const fromIdx = chain.indexOf(fromPort.id)
  const toIdx = chain.indexOf(toPort.id)
  if (fromIdx < 0 || toIdx < 0) {
    return estimateLegMinutes(fromPort, toPort, direction)
  }

  let total = 0
  if (fromIdx < toIdx) {
    for (let i = fromIdx; i < toIdx; i += 1) {
      const current = ports.find((port) => port.id === chain[i])
      const next = ports.find((port) => port.id === chain[i + 1])
      if (!current || !next) continue
      total += direction === 'downstream'
        ? legMinutesBetweenPorts(current, next, 'downstream')
        : legMinutesBetweenPorts(current, next, 'upstream')
    }
    return total
  }

  for (let i = fromIdx; i > toIdx; i -= 1) {
    const prev = ports.find((port) => port.id === chain[i - 1])
    const current = ports.find((port) => port.id === chain[i])
    if (!prev || !current) continue
    total += direction === 'upstream'
      ? legMinutesBetweenPorts(prev, current, 'upstream')
      : legMinutesBetweenPorts(prev, current, 'downstream')
  }
  return total
}

/** 为路径规划各节点填充累计航行时间（分钟，mock 汇总值） */
export function applySailTimesToStops<T extends RouteStopLike>(
  stops: T[],
  direction: 'upstream' | 'downstream',
  ports: Port[],
): T[] {
  let cumulative = 0
  return stops.map((stop, index) => {
    if (index === 0) return { ...stop, sailTime: '' }
    const leg = computeLegSailMinutes(stops[index - 1], stop, direction, ports)
    cumulative += leg
    return { ...stop, sailTime: leg > 0 ? String(cumulative) : stop.sailTime }
  })
}

export function formatSailTimeMinutes(value: string | undefined): string {
  if (!value?.trim()) return '-'
  const minutes = Number(value)
  if (Number.isFinite(minutes) && minutes > 0) return `${minutes} 分钟`
  return value
}
