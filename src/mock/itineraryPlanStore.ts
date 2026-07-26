import type { ItineraryPlan } from '@/types'

const demoSchedule: ItineraryPlan['schedule'] = [
  { id: 'tit01_1', portName: '重庆港', day: 0, arrivalTime: '', departureTime: '20:00', activityCategory: '', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
  { id: 'tit01_2', portName: '丰都', day: 1, arrivalTime: '08:00', departureTime: '12:00', activityCategory: '景点游览', theme: '丰都鬼城', startTime: '08:30', endTime: '11:30', description: '游览丰都鬼城', agency: '中青旅', attraction: '丰都鬼城' },
  { id: 'tit01_3', portName: '丰都', day: 1, arrivalTime: '08:00', departureTime: '12:00', activityCategory: '正餐', theme: '船上自助午餐', startTime: '12:00', endTime: '13:00', description: '船上自助午餐', agency: '', attraction: '' },
  { id: 'tit01_4', portName: '奉节', day: 2, arrivalTime: '07:00', departureTime: '14:00', activityCategory: '景点游览', theme: '白帝城', startTime: '08:00', endTime: '12:00', description: '游览白帝城', agency: '春秋旅游', attraction: '' },
  { id: 'tit01_5', portName: '宜昌港', day: 4, arrivalTime: '09:00', departureTime: '', activityCategory: '', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
]

const demoSegments: ItineraryPlan['segments'] = [
  { id: 'seg01', routeLegIndex: 0, fromPortId: 'p10', toPortId: 'p02', day: 0, departureTime: '20:00', speedKmH: 18, passengerOnOff: true, attractionIds: ['a02'], activities: [], remark: '重庆港启航。' },
  { id: 'seg02', routeLegIndex: 1, fromPortId: 'p02', toPortId: 'p03', day: 1, departureTime: '12:00', speedKmH: 18, passengerOnOff: false, attractionIds: ['a03'], activities: [], remark: '丰都鬼城。' },
  { id: 'seg03', routeLegIndex: 2, fromPortId: 'p03', toPortId: 'p07', day: 2, departureTime: '14:00', speedKmH: 18, passengerOnOff: false, attractionIds: ['a07'], activities: [], remark: '奉节白帝城。' },
]

let plans: ItineraryPlan[] = [
  {
    id: 'itn01',
    code: 'ITN-20260515-CQYC',
    name: '重庆至宜昌三峡示例行程',
    routeId: 'r01',
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-05-31',
    segments: demoSegments,
    schedule: demoSchedule.map((item) => ({ ...item })),
    updatedAt: '2026-05-01T09:30:00',
    updatedBy: '系统管理员',
  },
  {
    id: 'itn02',
    code: 'ITN-20260601-CQYC',
    name: '重庆至宜昌三峡夏季行程',
    routeId: 'r01',
    effectiveStart: '2026-06-01',
    effectiveEnd: '2026-12-31',
    segments: demoSegments.map((segment) => ({ ...segment })),
    schedule: demoSchedule.map((item) => (
      item.portName === '奉节'
        ? { ...item, theme: '白帝城夏季专场', description: '夏季时间表游览白帝城' }
        : { ...item }
    )),
    updatedAt: '2026-05-20T10:00:00',
    updatedBy: '系统管理员',
  },
]

export function listItineraryPlans(): ItineraryPlan[] {
  return plans.map((plan) => ({
    ...plan,
    segments: plan.segments.map((segment) => ({ ...segment, attractionIds: [...segment.attractionIds] })),
    schedule: plan.schedule.map((item) => ({ ...item })),
  }))
}

export function getItineraryPlanById(id: string): ItineraryPlan | undefined {
  const plan = plans.find((item) => item.id === id)
  if (!plan) return undefined
  return {
    ...plan,
    segments: plan.segments.map((segment) => ({ ...segment, attractionIds: [...segment.attractionIds] })),
    schedule: plan.schedule.map((item) => ({ ...item })),
  }
}

export function listItineraryPlansByRoute(routeId: string): ItineraryPlan[] {
  return listItineraryPlans()
    .filter((plan) => plan.routeId === routeId)
    .sort((a, b) => a.effectiveStart.localeCompare(b.effectiveStart))
}

export function resolveItineraryPlanByRouteAndDate(routeId: string, departureDate: string): ItineraryPlan | undefined {
  if (!routeId || !departureDate) return undefined
  return listItineraryPlansByRoute(routeId)
    .filter((plan) => plan.effectiveStart <= departureDate && plan.effectiveEnd >= departureDate)
    .sort((a, b) => b.effectiveStart.localeCompare(a.effectiveStart))[0]
}

export function saveItineraryPlans(nextPlans: ItineraryPlan[]) {
  plans = nextPlans.map((plan) => ({
    ...plan,
    segments: plan.segments.map((segment) => ({ ...segment, attractionIds: [...segment.attractionIds] })),
    schedule: plan.schedule.map((item) => ({ ...item })),
  }))
}

export function upsertItineraryPlan(plan: ItineraryPlan) {
  const index = plans.findIndex((item) => item.id === plan.id)
  const normalized = {
    ...plan,
    segments: plan.segments.map((segment) => ({ ...segment, attractionIds: [...segment.attractionIds] })),
    schedule: plan.schedule.map((item) => ({ ...item })),
  }
  if (index >= 0) plans[index] = normalized
  else plans = [normalized, ...plans]
}
