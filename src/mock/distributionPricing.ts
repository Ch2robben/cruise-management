export interface DistributionGroupSummary {
  id: string
  name: string
  lastOperatedAt: string
}

export type DistributionProductType = '游船产品' | '期票产品' | '套票产品' | '附加产品'

export interface DistributionScopeOption {
  id: string
  name: string
  selected: boolean
}

export interface DistributionPriceItem {
  id: string
  productType: DistributionProductType
  productName: string
  routeName: string
  segments: DistributionScopeOption[]
  voyages: DistributionScopeOption[]
  saleEnabled: boolean
}

export const distributionGroups: DistributionGroupSummary[] = [
  { id: 'group_a', name: 'A组', lastOperatedAt: '2026-07-15 15:20:20' },
  { id: 'group_b', name: 'B组', lastOperatedAt: '2026-07-14 10:35:12' },
  { id: 'group_c', name: 'C组', lastOperatedAt: '2026-07-12 09:18:45' },
  { id: 'group_d', name: 'D组', lastOperatedAt: '2026-07-10 17:42:08' },
]

export const initialDistributionPrices: DistributionPriceItem[] = [
  {
    id: 'price_01',
    productType: '游船产品',
    productName: '长江荣耀',
    routeName: '两江环线',
    segments: [
      { id: 'segment_01', name: '和平码头—洪崖洞码头', selected: true },
      { id: 'segment_02', name: '洪崖洞码头—和平码头', selected: true },
    ],
    voyages: [
      { id: 'voyage_01', name: 'V20260718 · 2026-07-18 19:30', selected: true },
      { id: 'voyage_02', name: 'V20260719 · 2026-07-19 19:30', selected: true },
      { id: 'voyage_03', name: 'V20260720 · 2026-07-20 19:30', selected: true },
    ],
    saleEnabled: true,
  },
  {
    id: 'price_02',
    productType: '游船产品',
    productName: '重庆两江游',
    routeName: '朝天门夜游环线',
    segments: [
      { id: 'segment_03', name: '朝天门码头—弹子石码头', selected: true },
      { id: 'segment_04', name: '弹子石码头—朝天门码头', selected: false },
    ],
    voyages: [
      { id: 'voyage_04', name: 'V20260720 · 2026-07-20 20:00', selected: true },
      { id: 'voyage_05', name: 'V20260721 · 2026-07-21 20:00', selected: false },
    ],
    saleEnabled: true,
  },
  { id: 'price_03', productType: '期票产品', productName: '两江夜游期票', routeName: '', segments: [], voyages: [], saleEnabled: true },
  { id: 'price_04', productType: '套票产品', productName: '两江夜游＋索道套票', routeName: '', segments: [], voyages: [], saleEnabled: true },
  { id: 'price_05', productType: '附加产品', productName: '游轮自助晚餐', routeName: '', segments: [], voyages: [], saleEnabled: false },
]
