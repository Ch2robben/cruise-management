import { dictionaryApi } from '@/mock/api'

export interface DictionaryOption {
  value: string
  label: string
}

export async function loadDictionaryOptions(dictCode: string): Promise<DictionaryOption[]> {
  const result = await dictionaryApi.list({ pageSize: 100, dictCode, status: 'enabled' })
  return result.data
    .filter((item) => item.dictCode === dictCode && item.status === 'enabled')
    .sort((a, b) => a.sort - b.sort)
    .map((item) => ({
      value: item.itemName,
      label: item.itemName,
    }))
}
