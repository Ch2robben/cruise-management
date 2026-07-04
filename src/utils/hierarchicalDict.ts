import { hierarchicalDictApi } from '@/mock/api'
import type { HierarchicalDictItem, HierarchicalDictTypeCode } from '@/types'

export const HIERARCHICAL_DICT_TYPES: { code: HierarchicalDictTypeCode; name: string }[] = [
  { code: 'ACTIVITY_CATEGORY', name: '活动分类' },
  { code: 'PRIVILEGE_TYPE', name: '礼遇类型' },
  { code: 'ATTRACTION_SERVICE', name: '景点服务' },
  { code: 'CRUISE_FACILITY', name: '游轮设施' },
  { code: 'CABIN_FACILITY', name: '船舱设施' },
]

export interface HierarchicalDictOption {
  value: string
  label: string
}

export function getHierarchicalDictTypeName(dictType: HierarchicalDictTypeCode) {
  return HIERARCHICAL_DICT_TYPES.find((item) => item.code === dictType)?.name || dictType
}

export function buildHierarchicalDictOptions(
  records: HierarchicalDictItem[],
  dictType: HierarchicalDictTypeCode,
): HierarchicalDictOption[] {
  const scoped = records.filter((item) => item.dictType === dictType)
  const parents = new Map(
    scoped.filter((item) => item.level === 1).map((item) => [item.id, item.nameCn]),
  )

  return scoped
    .filter((item) => item.level === 2 && item.status === 'enabled')
    .sort((a, b) => {
      const parentSortA = scoped.find((item) => item.id === a.parentId)?.sort ?? 0
      const parentSortB = scoped.find((item) => item.id === b.parentId)?.sort ?? 0
      if (parentSortA !== parentSortB) return parentSortA - parentSortB
      return a.sort - b.sort
    })
    .map((item) => ({
      value: item.nameCn,
      label: item.parentId && parents.get(item.parentId)
        ? `${parents.get(item.parentId)} / ${item.nameCn}`
        : item.nameCn,
    }))
}

export async function loadHierarchicalDictOptions(dictType: HierarchicalDictTypeCode): Promise<HierarchicalDictOption[]> {
  const result = await hierarchicalDictApi.list({ pageSize: 300, status: 'enabled', dictType })
  return buildHierarchicalDictOptions(result.data, dictType)
}
