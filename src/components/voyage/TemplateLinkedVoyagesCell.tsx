import type { Voyage } from '@/types'

interface TemplateLinkedVoyagesCellProps {
  voyages: Voyage[]
  maxVisible?: number
}

export default function TemplateLinkedVoyagesCell({ voyages, maxVisible = 2 }: TemplateLinkedVoyagesCellProps) {
  if (!voyages.length) {
    return <span className="text-sm text-gray-400">-</span>
  }

  const visible = voyages.slice(0, maxVisible)
  const label = voyages.length > maxVisible
    ? `${visible.map((item) => item.voyageNo).join('、')} 等${voyages.length}个`
    : visible.map((item) => item.voyageNo).join('、')

  const title = voyages.map((item) => `${item.voyageNo}（${item.startDate}）`).join('\n')

  return (
    <span className="text-sm text-gray-700" title={title}>
      {label}
    </span>
  )
}
