import type { AdditionalProduct, AdditionalProductCategory } from '@/types'

export const additionalProductCategories: AdditionalProductCategory[] = [
  { id: 'apc-stay', name: '住宿服务', parentId: null, level: 1, sort: 1, status: 'enabled' },
  { id: 'apc-hotel', name: '酒店住宿', parentId: 'apc-stay', level: 2, sort: 1, status: 'enabled' },
  { id: 'apc-food', name: '餐饮服务', parentId: null, level: 1, sort: 2, status: 'enabled' },
  { id: 'apc-meal', name: '餐费', parentId: 'apc-food', level: 2, sort: 1, status: 'enabled' },
  { id: 'apc-banquet', name: '特色餐饮', parentId: 'apc-food', level: 2, sort: 2, status: 'enabled' },
  { id: 'apc-ticket', name: '票务服务', parentId: null, level: 1, sort: 3, status: 'enabled' },
  { id: 'apc-attraction', name: '景区门票', parentId: 'apc-ticket', level: 2, sort: 1, status: 'enabled' },
  { id: 'apc-show', name: '演出票', parentId: 'apc-ticket', level: 2, sort: 2, status: 'enabled' },
]

export const initialAdditionalProducts: AdditionalProduct[] = [
  { id: 'ap001', categoryId: 'apc-hotel', name: '重庆登船前一晚酒店', required: false, chargeMethod: 'per_room', amount: 680, sourceType: 'external', sourceName: '锦江酒店接口', externalCode: 'HOTEL-CQ-001', relatedProductIds: ['prod01', 'prod02', 'prod15'], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-07-18 10:20:00', createdAt: '2026-06-01 09:00:00' },
  { id: 'ap002', categoryId: 'apc-meal', name: '登船日晚餐', required: true, chargeMethod: 'per_person', amount: 128, sourceType: 'internal', sourceName: '游轮餐饮系统', externalCode: 'MEAL-DINNER-01', relatedProductIds: ['prod01', 'prod02'], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-07-17 16:10:00', createdAt: '2026-06-02 09:00:00' },
  { id: 'ap003', categoryId: 'apc-banquet', name: '船长欢迎晚宴升级', required: false, chargeMethod: 'per_person', amount: 298, sourceType: 'internal', sourceName: '游轮餐饮系统', externalCode: 'MEAL-VIP-01', relatedProductIds: ['prod01', 'prod03'], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-07-16 14:30:00', createdAt: '2026-06-03 09:00:00' },
  { id: 'ap004', categoryId: 'apc-attraction', name: '白帝城门票', required: false, chargeMethod: 'per_person', amount: 100, sourceType: 'external', sourceName: '景区票务平台', externalCode: 'TICKET-BDC-01', relatedProductIds: ['prod01', 'prod02', 'prod03', 'prod15'], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-07-15 11:00:00', createdAt: '2026-06-04 09:00:00' },
  { id: 'ap005', categoryId: 'apc-attraction', name: '三峡人家门票及接驳', required: false, chargeMethod: 'per_person', amount: 260, sourceType: 'external', sourceName: '景区票务平台', externalCode: 'TICKET-SXRJ-01', relatedProductIds: ['prod01', 'prod03'], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-07-14 09:45:00', createdAt: '2026-06-05 09:00:00' },
  { id: 'ap006', categoryId: 'apc-show', name: '烽烟三国演出票', required: false, chargeMethod: 'per_person', amount: 220, sourceType: 'external', sourceName: '演艺票务中心', externalCode: 'SHOW-FYSG-01', relatedProductIds: ['prod01', 'prod02'], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-07-13 18:20:00', createdAt: '2026-06-06 09:00:00' },
]

export function getAdditionalCategoryPath(categoryId: string) {
  const child = additionalProductCategories.find((item) => item.id === categoryId)
  const parent = additionalProductCategories.find((item) => item.id === child?.parentId)
  return parent ? `${parent.name} / ${child?.name ?? '-'}` : child?.name ?? '-'
}

export function getAdditionalProductsForProduct(productId = 'prod01') {
  return initialAdditionalProducts.filter(
    (item) => item.status === 'enabled' && item.relatedProductIds.includes(productId),
  )
}
