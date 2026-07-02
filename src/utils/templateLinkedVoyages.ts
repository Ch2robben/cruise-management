import type { Voyage } from '@/types'

export function groupVoyagesByTemplateId(voyages: Voyage[]): Map<string, Voyage[]> {
  const map = new Map<string, Voyage[]>()
  voyages.forEach((voyage) => {
    if (!voyage.templateId) return
    const list = map.get(voyage.templateId) || []
    list.push(voyage)
    map.set(voyage.templateId, list)
  })
  map.forEach((list, key) => {
    map.set(
      key,
      [...list].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.voyageNo.localeCompare(b.voyageNo)),
    )
  })
  return map
}

export function getLinkedVoyagesForTemplate(templateId: string, voyages: Voyage[]): Voyage[] {
  return voyages
    .filter((item) => item.templateId === templateId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.voyageNo.localeCompare(b.voyageNo))
}
