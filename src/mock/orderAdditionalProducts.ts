import { getAdditionalCategoryPath, initialAdditionalProducts } from '@/mock/additionalProducts'

export type AdditionalProductSyncStatus = 'pending' | 'synced' | 'failed'

export interface OrderAdditionalProductLine {
  id: string
  orderId: string
  orderNo: string
  voyageNo: string
  sailDate: string
  dealer: string
  additionalProductId: string
  categoryPath: string
  productName: string
  chargeMethod: 'per_person' | 'per_room'
  targetType: 'person' | 'room'
  targetName: string
  quantity: number
  unitAmount: number
  totalAmount: number
  sourceName: string
  externalCode: string
  syncStatus: AdditionalProductSyncStatus
  lastSyncAt: string
  syncMessage: string
  updatedAt: string
}

interface SeedLine {
  id: string
  orderId: string
  orderNo: string
  voyageNo: string
  sailDate: string
  dealer: string
  additionalProductId: string
  targetType: 'person' | 'room'
  targetName: string
  quantity: number
  syncStatus: AdditionalProductSyncStatus
  lastSyncAt?: string
  syncMessage?: string
}

const seedLines: SeedLine[] = [
  { id: 'oap001', orderId: '1', orderNo: '0000000H', voyageNo: '212101', sailDate: '2021-09-30', dealer: '宜昌趸多', additionalProductId: 'ap004', targetType: 'person', targetName: '邓浪', quantity: 1, syncStatus: 'synced', lastSyncAt: '2026-07-20 10:12:00' },
  { id: 'oap002', orderId: '2', orderNo: '0000000C', voyageNo: '211901', sailDate: '2021-10-02', dealer: '宜昌趸多', additionalProductId: 'ap006', targetType: 'person', targetName: '彭彬', quantity: 1, syncStatus: 'pending' },
  { id: 'oap003', orderId: '2', orderNo: '0000000C', voyageNo: '211901', sailDate: '2021-10-02', dealer: '宜昌趸多', additionalProductId: 'ap006', targetType: 'person', targetName: '游客2', quantity: 1, syncStatus: 'pending' },
  { id: 'oap004', orderId: '3', orderNo: '0000003K', voyageNo: '212102', sailDate: '2021-10-03', dealer: '销售二分部', additionalProductId: 'ap001', targetType: 'room', targetName: '房间 301', quantity: 1, syncStatus: 'failed', lastSyncAt: '2026-07-20 09:35:00', syncMessage: '外部酒店库存已关闭，请重新确认房态' },
  { id: 'oap005', orderId: '3', orderNo: '0000003K', voyageNo: '212102', sailDate: '2021-10-03', dealer: '销售二分部', additionalProductId: 'ap004', targetType: 'person', targetName: '山田太郎', quantity: 1, syncStatus: 'synced', lastSyncAt: '2026-07-20 09:36:00' },
  { id: 'oap006', orderId: '3', orderNo: '0000003K', voyageNo: '212102', sailDate: '2021-10-03', dealer: '销售二分部', additionalProductId: 'ap005', targetType: 'person', targetName: '佐藤美咲', quantity: 1, syncStatus: 'synced', lastSyncAt: '2026-07-20 09:36:00' },
  { id: 'oap007', orderId: '4', orderNo: '00000001', voyageNo: '212103', sailDate: '2021-10-07', dealer: '重庆神州', additionalProductId: 'ap004', targetType: 'person', targetName: '张明', quantity: 1, syncStatus: 'pending' },
  { id: 'oap008', orderId: '4', orderNo: '00000001', voyageNo: '212103', sailDate: '2021-10-07', dealer: '重庆神州', additionalProductId: 'ap004', targetType: 'person', targetName: '李红', quantity: 1, syncStatus: 'pending' },
  { id: 'oap009', orderId: '4', orderNo: '00000001', voyageNo: '212103', sailDate: '2021-10-07', dealer: '重庆神州', additionalProductId: 'ap001', targetType: 'room', targetName: '房间 1', quantity: 1, syncStatus: 'synced', lastSyncAt: '2026-07-19 17:20:00' },
  { id: 'oap010', orderId: '4', orderNo: '00000001', voyageNo: '212103', sailDate: '2021-10-07', dealer: '重庆神州', additionalProductId: 'ap006', targetType: 'person', targetName: '王强', quantity: 1, syncStatus: 'failed', lastSyncAt: '2026-07-20 08:45:00', syncMessage: '票务平台返回游客证件信息不完整' },
]

export const orderAdditionalProductLines: OrderAdditionalProductLine[] = seedLines.flatMap((seed) => {
  const product = initialAdditionalProducts.find((item) => item.id === seed.additionalProductId)
  if (!product) return []
  return [{
    ...seed,
    categoryPath: getAdditionalCategoryPath(product.categoryId),
    productName: product.name,
    chargeMethod: product.chargeMethod,
    unitAmount: product.amount,
    totalAmount: product.amount * seed.quantity,
    sourceName: product.sourceName,
    externalCode: product.externalCode,
    lastSyncAt: seed.lastSyncAt ?? '',
    syncMessage: seed.syncMessage ?? '',
    updatedAt: '2026-07-20 10:20:00',
  }]
})
