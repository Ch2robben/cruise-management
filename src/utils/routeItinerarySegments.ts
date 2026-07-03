import type { ItineraryPlanSegment, Port, Route, RouteStop } from '@/types'
import { generateId } from '@/utils/format'

function resolvePortId(stop: RouteStop, ports: Port[]): string {
  if (stop.portId) return stop.portId
  const matched = ports.find((port) => port.name === stop.portName || port.name.includes(stop.portName) || stop.portName.includes(port.name))
  return matched?.id || ''
}

export function segmentLegKey(fromPortId: string, toPortId: string) {
  return `${fromPortId}-${toPortId}`
}

/** 根据航线停靠点生成连续航段（起港→经停→止港） */
export function buildSegmentsFromRoute(route: Route, ports: Port[]): ItineraryPlanSegment[] {
  const stops = route.stops || []
  if (stops.length < 2) return []

  return stops.slice(0, -1).map((fromStop, index) => {
    const toStop = stops[index + 1]
    const fromPortId = resolvePortId(fromStop, ports)
    const toPortId = resolvePortId(toStop, ports)
    return {
      id: generateId(),
      routeLegIndex: index,
      fromPortId,
      toPortId,
      day: 0,
      departureTime: '',
      speedKmH: 18,
      passengerOnOff: fromStop.embarkDisembark ?? (fromStop.type === 'start' || fromStop.type === 'end'),
      attractionIds: [],
      activities: [],
      remark: toStop.pierName ? `停靠：${toStop.pierName}` : '',
    }
  })
}

/** 航线结构变更时，尽量保留已配置的航速、景点与活动 */
export function mergeRouteSegmentsWithConfig(
  routeSegments: ItineraryPlanSegment[],
  existing: ItineraryPlanSegment[],
): ItineraryPlanSegment[] {
  const existingMap = new Map(existing.map((segment) => [segmentLegKey(segment.fromPortId, segment.toPortId), segment]))
  return routeSegments.map((segment) => {
    const prev = existingMap.get(segmentLegKey(segment.fromPortId, segment.toPortId))
    if (!prev) return segment
    return {
      ...segment,
      day: prev.day,
      departureTime: prev.departureTime,
      speedKmH: prev.speedKmH,
      attractionIds: [...prev.attractionIds],
      activities: (prev.activities || []).map((item) => ({ ...item })),
      passengerOnOff: prev.passengerOnOff,
      remark: prev.remark || segment.remark,
    }
  })
}
