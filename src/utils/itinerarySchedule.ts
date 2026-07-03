import type { ItineraryPlan, ItineraryPlanSegment, Port, TemplateItinerary } from '@/types'
import { createTemplateItineraryItem } from '@/components/voyage/ItineraryEditor'
import { getItineraryPlanById } from '@/mock/itineraryPlanStore'

export function buildScheduleFromSegments(
  segments: ItineraryPlanSegment[],
  portMap: Map<string, Port>,
): TemplateItinerary[] {
  const stops: Array<{ portName: string; day: number; arrivalTime: string; departureTime: string }> = []
  const firstSegment = segments[0]

  if (firstSegment?.fromPortId) {
    stops.push({
      portName: portMap.get(firstSegment.fromPortId)?.name || '',
      day: firstSegment.day ?? 0,
      arrivalTime: '',
      departureTime: firstSegment.departureTime,
    })
  }

  segments.forEach((segment, index) => {
    if (!segment.toPortId) return
    const nextSegment = segments[index + 1]
    const isEnd = index === segments.length - 1
    stops.push({
      portName: portMap.get(segment.toPortId)?.name || '',
      day: segment.day ?? index + 1,
      arrivalTime: isEnd ? '' : nextSegment?.departureTime || '',
      departureTime: isEnd ? '' : nextSegment?.departureTime || '',
    })
  })

  return stops
    .filter((stop) => stop.portName)
    .map((stop) => createTemplateItineraryItem({
      portName: stop.portName,
      day: stop.day,
      arrivalTime: stop.arrivalTime,
      departureTime: stop.departureTime,
    }))
}

export function flattenSegmentActivities(segments: ItineraryPlanSegment[] = []): TemplateItinerary[] {
  return segments.flatMap((segment) => segment.activities || [])
}

export function resolveItinerarySchedule(plan?: Pick<ItineraryPlan, 'schedule' | 'segments'> | null): TemplateItinerary[] {
  const fromSegments = flattenSegmentActivities(plan?.segments)
  if (fromSegments.length > 0) return fromSegments
  return plan?.schedule || []
}

export function resolveProductItinerarySchedule(itineraryPlanId?: string): TemplateItinerary[] {
  if (!itineraryPlanId) return []
  return resolveItinerarySchedule(getItineraryPlanById(itineraryPlanId))
}
