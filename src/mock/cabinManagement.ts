export type CabinRecord = {
  id: string
  shipName: string
  cabinName: string
  floors: string[]
  photos: string[]
  facilities: string[]
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
  {
    id: '1',
    shipName: '长江叁号',
    cabinName: '长江叁号豪华阳台标准间',
    floors: ['2F', '3F', '4F'],
    photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80'],
    facilities: ['独立阳台', '智能客控', '迷你吧'],
    cabinCount: 500,
    guestCapacity: 3,
    bedCount: 2,
    sortNo: 1,
    updatedBy: '彭琳',
    updatedAt: '2024-11-07 14:35:11',
    alertEnabled: true,
    alertType: 'percentage',
    alertValue: 10,
    countDimension: 'room',
  },
  {
    id: '2',
    shipName: '长江叁号',
    cabinName: '标准间',
    floors: ['2F', '3F'],
    photos: [],
    facilities: ['独立卫浴', '安全救生配置'],
    cabinCount: 500,
    guestCapacity: 3,
    bedCount: 2,
    sortNo: 1,
    updatedBy: '赵昕玥',
    updatedAt: '2024-11-07 15:24:53',
    countDimension: 'room',
  },
  {
    id: '3',
    shipName: '长江壹号',
    cabinName: '长江壹号豪华套房',
    floors: ['5F'],
    photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=82'],
    facilities: ['独立阳台', '迷你吧', '智能客控'],
    cabinCount: 6,
    guestCapacity: 3,
    bedCount: 2,
    sortNo: 2,
    updatedBy: '彭琳',
    updatedAt: '2022-09-01 14:25:19',
    countDimension: 'room',
  },
  {
    id: '4',
    shipName: '长江壹号',
    cabinName: '长江壹号观景房',
    floors: ['2F', '3F'],
    photos: [],
    facilities: ['独立阳台', '独立卫浴'],
    cabinCount: 2,
    guestCapacity: 3,
    bedCount: 2,
    sortNo: 2,
    updatedBy: '彭琳',
    updatedAt: '2023-02-02 09:15:19',
  },
  {
    id: '5',
    shipName: '长江壹号',
    cabinName: '长江壹号行政房',
    floors: ['3F', '4F'],
    photos: [],
    facilities: ['智能客控', '迷你吧', '安全救生配置'],
    cabinCount: 4,
    guestCapacity: 3,
    bedCount: 2,
    sortNo: 2,
    updatedBy: '彭琳',
    updatedAt: '2023-02-02 09:15:34',
  },
  {
    id: '6',
    shipName: '长江壹号',
    cabinName: '长江壹号总统套房',
    floors: ['5F'],
    photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=84'],
    facilities: ['独立阳台', '独立卫浴', '迷你吧', '智能客控'],
    cabinCount: 2,
    guestCapacity: 3,
    bedCount: 2,
    sortNo: 3,
    updatedBy: '彭琳',
    updatedAt: '2022-09-01 14:25:25',
  },
]
