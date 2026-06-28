export type CabinRecord = {
  id: string
  shipName: string
  cabinName: string
  cabinCount: number
  guestCapacity: number
  bedCount: number
  sortNo: number
  updatedBy: string
  updatedAt: string
  alertEnabled?: boolean
  alertType?: 'percentage' | 'quantity'
  alertValue?: number
  countDimension?: 'room' | 'bed'
}

export const cabinShipOptions = ['all', '长江壹号', '长江叁号']

export const initialCabinData: CabinRecord[] = [
  { id: '1', shipName: '长江叁号', cabinName: '长江叁号豪华阳台标准间', cabinCount: 500, guestCapacity: 3, bedCount: 2, sortNo: 1, updatedBy: '彭琳', updatedAt: '2024-11-07 14:35:11', alertEnabled: true, alertType: 'percentage', alertValue: 10, countDimension: 'room' },
  { id: '2', shipName: '长江叁号', cabinName: '标准间', cabinCount: 500, guestCapacity: 3, bedCount: 2, sortNo: 1, updatedBy: '赵昕玥', updatedAt: '2024-11-07 15:24:53', countDimension: 'room' },
  { id: '3', shipName: '长江壹号', cabinName: '长江壹号豪华套房', cabinCount: 6, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2022-09-01 14:25:19', countDimension: 'room' },
  { id: '4', shipName: '长江壹号', cabinName: '长江壹号观景房', cabinCount: 2, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2023-02-02 09:15:19' },
  { id: '5', shipName: '长江壹号', cabinName: '长江壹号行政房', cabinCount: 4, guestCapacity: 3, bedCount: 2, sortNo: 2, updatedBy: '彭琳', updatedAt: '2023-02-02 09:15:34' },
  { id: '6', shipName: '长江壹号', cabinName: '长江壹号总统套房', cabinCount: 2, guestCapacity: 3, bedCount: 2, sortNo: 3, updatedBy: '彭琳', updatedAt: '2022-09-01 14:25:25' },
]
