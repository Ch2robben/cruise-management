import type { GuestType, TicketOccupancyType } from '@/types'

export type TicketClassTypeDef = {
  guestType: GuestType
  occupancyType: TicketOccupancyType
  label: string
}

export type TicketClassDef = {
  id: string
  name: string
  types: TicketClassTypeDef[]
}

export const ticketClassCatalog: TicketClassDef[] = [
  {
    id: 'tc-2adult',
    name: '双成人',
    types: [
      { guestType: 'adult', occupancyType: '标准入住', label: '成人①' },
      { guestType: 'adult', occupancyType: '标准入住', label: '成人②' },
    ],
  },
  {
    id: 'tc-single',
    name: '单间',
    types: [{ guestType: 'adult', occupancyType: '标准入住', label: '成人' }],
  },
  {
    id: 'tc-1adult-1child',
    name: '一大一小（儿童占床）',
    types: [
      { guestType: 'adult', occupancyType: '标准入住', label: '成人' },
      { guestType: 'child', occupancyType: '加床', label: '儿童' },
    ],
  },
  {
    id: 'tc-2adult-baby',
    name: '两大一婴儿',
    types: [
      { guestType: 'adult', occupancyType: '标准入住', label: '成人①' },
      { guestType: 'adult', occupancyType: '标准入住', label: '成人②' },
      { guestType: 'baby', occupancyType: '不占床', label: '婴儿' },
    ],
  },
  {
    id: 'tc-third-child-nobed',
    name: '第三人儿童不占床',
    types: [
      { guestType: 'adult', occupancyType: '标准入住', label: '成人①' },
      { guestType: 'adult', occupancyType: '标准入住', label: '成人②' },
      { guestType: 'child', occupancyType: '不占床', label: '儿童' },
    ],
  },
  {
    id: 'tc-third-child-bed',
    name: '第三人儿童加床',
    types: [
      { guestType: 'adult', occupancyType: '标准入住', label: '成人①' },
      { guestType: 'adult', occupancyType: '标准入住', label: '成人②' },
      { guestType: 'child', occupancyType: '加床', label: '儿童' },
    ],
  },
  {
    id: 'tc-3adult',
    name: '三大成人加床',
    types: [
      { guestType: 'adult', occupancyType: '标准入住', label: '成人①' },
      { guestType: 'adult', occupancyType: '标准入住', label: '成人②' },
      { guestType: 'adult', occupancyType: '加床', label: '成人③' },
    ],
  },
  {
    id: 'tc-4adult',
    name: '四成人组合',
    types: [
      { guestType: 'adult', occupancyType: '标准入住', label: '成人①' },
      { guestType: 'adult', occupancyType: '标准入住', label: '成人②' },
      { guestType: 'adult', occupancyType: '标准入住', label: '成人③' },
      { guestType: 'adult', occupancyType: '标准入住', label: '成人④' },
    ],
  },
]

export const scenarioTicketClassMap: Record<string, string> = {
  standard: 'tc-2adult',
  singleRoom: 'tc-single',
  oneAdultOneChild: 'tc-1adult-1child',
  twoAdultsOneBaby: 'tc-2adult-baby',
  thirdChildNoBed: 'tc-third-child-nobed',
  thirdChildExtraBed: 'tc-third-child-bed',
  thirdAdultExtraBed: 'tc-3adult',
  custom: 'tc-2adult',
}

export function getTicketClassById(id: string) {
  return ticketClassCatalog.find((item) => item.id === id)
}

export function getTicketClassTypeCount(id: string) {
  return getTicketClassById(id)?.types.length ?? 1
}

export function getDefaultPCoefficients(ticketClassId: string, fill = 1) {
  return Array(getTicketClassTypeCount(ticketClassId)).fill(fill)
}
