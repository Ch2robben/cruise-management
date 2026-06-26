import { useMemo } from 'react'
import { buildOrderTeams, formatGroupNameSummary, type CruiseOrder } from './orderTypes'

export default function GroupNameDisplay({
  order,
  compact = false,
  placement = 'below',
}: {
  order: CruiseOrder
  compact?: boolean
  placement?: 'above' | 'below'
}) {
  const teams = useMemo(() => buildOrderTeams(order), [order])
  const summary = formatGroupNameSummary(teams)

  if (teams.length <= 1) {
    return <span className={compact ? 'block max-w-full truncate' : ''}>{summary}</span>
  }

  const popoverPosition =
    placement === 'above'
      ? 'bottom-full mb-1'
      : 'top-full mt-1'

  return (
    <div className="group relative inline-block max-w-full align-top">
      <span
        className={`cursor-default border-b border-dashed border-gray-400 text-gray-900 ${compact ? 'block max-w-full truncate' : ''}`}
        title={summary}
      >
        {summary}
      </span>
      <div
        className={`invisible absolute left-0 z-50 min-w-[220px] rounded-lg border border-gray-200 bg-white p-3 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 ${popoverPosition}`}
      >
        <div className="mb-2 text-xs font-medium text-gray-500">团信息</div>
        <ul className="space-y-2">
          {teams.map((team) => (
            <li key={team.id} className="text-sm">
              <div className="font-medium text-gray-900">{team.name}</div>
              <div className="mt-0.5 text-xs text-gray-500">{team.roomCount} 间房 · {team.guestCount} 人</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
