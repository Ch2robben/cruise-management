import type { HierarchicalDictTypeCode } from '@/types'
import { buildHierarchicalDictOptions, loadHierarchicalDictOptions } from '@/utils/hierarchicalDict'

export type ActivityCategoryOption = { value: string; label: string }

const ACTIVITY_DICT_TYPE: HierarchicalDictTypeCode = 'ACTIVITY_CATEGORY'

const fallbackActivityCategoryOptions: ActivityCategoryOption[] = [
  { value: '景点游览', label: '岸上活动 / 景点游览' },
  { value: '正餐', label: '餐饮 / 正餐' },
  { value: '文艺表演', label: '船上活动 / 文艺表演' },
  { value: '太极拳', label: '船上活动 / 太极拳' },
]

export async function loadActivityCategoryOptions(): Promise<ActivityCategoryOption[]> {
  const options = await loadHierarchicalDictOptions(ACTIVITY_DICT_TYPE)
  return options.length > 0 ? options : fallbackActivityCategoryOptions
}

export { buildHierarchicalDictOptions as buildActivityCategoryOptions }
