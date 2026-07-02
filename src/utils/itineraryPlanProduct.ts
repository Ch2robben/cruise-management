import { resolveMileageDistance } from '@/mock/yangtzeRiverMileage'
import type { ItineraryPlan, Port, ProductSegment } from '@/types'

export interface ItineraryPlanStop {
  name: string
  day: number
  dist: number
}

export function buildStopsFromItineraryPlan(plan: ItineraryPlan, portMap: Map<string, Port>): ItineraryPlanStop[] {
  const stops: ItineraryPlanStop[] = []
  const firstSegment = plan.segments[0]
  if (!firstSegment) return stops

  if (firstSegment.fromPortId) {
    stops.push({
      name: portMap.get(firstSegment.fromPortId)?.name || '',
      day: firstSegment.day ?? 0,
      dist: 0,
    })
  }

  plan.segments.forEach((segment) => {
    if (!segment.toPortId) return
    const fromPort = portMap.get(segment.fromPortId)
    const toPort = portMap.get(segment.toPortId)
    const resolved = resolveMileageDistance(fromPort, toPort, [])
    stops.push({
      name: toPort?.name || '',
      day: segment.day ?? stops.length,
      dist: resolved.distance?.distanceKm || 0,
    })
  })

  return stops.filter((stop) => stop.name)
}

export function inferRouteTypeFromStops(stops: ItineraryPlanStop[]): 'upstream' | 'downstream' {
  const start = stops[0]?.name || ''
  const end = stops[stops.length - 1]?.name || ''
  if (start.includes('宜昌') && end.includes('重庆')) return 'upstream'
  if (start.includes('重庆') && end.includes('宜昌')) return 'downstream'
  return 'downstream'
}

export function calcStopsTotalMileage(stops: ItineraryPlanStop[]): number {
  return stops.reduce((sum, stop) => sum + stop.dist, 0)
}

export function calcStopsTotalDays(stops: ItineraryPlanStop[]): number {
  if (stops.length === 0) return 0
  return Math.max(...stops.map((stop) => stop.day)) - stops[0].day
}

export function buildItineraryDuration(stops: ItineraryPlanStop[]): string {
  const days = calcStopsTotalDays(stops)
  const nights = Math.max(0, days - 1)
  return `${days}天${nights}晚`
}

export function buildProductSegmentsFromItineraryPlan(
  plan: ItineraryPlan,
  portMap: Map<string, Port>,
): Omit<ProductSegment, 'id'>[] {
  const legs = plan.segments.filter((segment) => segment.fromPortId && segment.toPortId)
  if (!legs.length) return []

  const productSegments: Omit<ProductSegment, 'id'>[] = []
  let startPort = portMap.get(legs[0].fromPortId)?.name || ''
  let startDay = legs[0].day ?? 0
  let mileage = 0
  let endPort = startPort
  let endDay = startDay

  const pushSegment = () => {
    if (!startPort || !endPort || startPort === endPort) return
    productSegments.push({
      startPort,
      endPort,
      days: Math.max(0, endDay - startDay),
      mileage,
      status: 'enabled',
    })
  }

  legs.forEach((leg) => {
    const toName = portMap.get(leg.toPortId)?.name || ''
    const resolved = resolveMileageDistance(portMap.get(leg.fromPortId), portMap.get(leg.toPortId), [])
    mileage += resolved.distance?.distanceKm || 0
    endPort = toName
    endDay = leg.day ?? endDay

    if (leg.passengerOnOff) {
      pushSegment()
      startPort = toName
      startDay = leg.day ?? startDay
      mileage = 0
      endPort = startPort
      endDay = startDay
    }
  })

  if (endPort !== startPort) {
    pushSegment()
  }

  return productSegments
}

export function getItineraryPlanAutoFill(plan: ItineraryPlan, portMap: Map<string, Port>) {
  const stops = buildStopsFromItineraryPlan(plan, portMap)
  const days = calcStopsTotalDays(stops)
  const nights = Math.max(0, days - 1)
  return {
    routeType: inferRouteTypeFromStops(stops),
    startPort: stops[0]?.name || '',
    endPort: stops[stops.length - 1]?.name || '',
    days,
    nights,
    mileage: calcStopsTotalMileage(stops),
    duration: buildItineraryDuration(stops),
    stops,
    productSegments: buildProductSegmentsFromItineraryPlan(plan, portMap),
  }
}
