import type { Port } from '@/types'
import { RIVER_REACH_OPTIONS } from '@/utils/constants'

const sortPortsByRiverOrder = (list: Port[]) =>
  [...list].sort((a, b) => (a.riverSort ?? 9999) - (b.riverSort ?? 9999) || a.name.localeCompare(b.name, 'zh-CN'))

interface PortSelectByReachProps {
  ports: Port[]
  showMileage?: boolean
}

export default function PortSelectByReach({ ports, showMileage = true }: PortSelectByReachProps) {
  const sorted = sortPortsByRiverOrder(ports)
  const grouped = RIVER_REACH_OPTIONS.map((item) => ({
    ...item,
    ports: sorted.filter((port) => port.riverReach === item.value),
  }))
  const others = sorted.filter((port) => !port.riverReach)

  return (
    <>
      {grouped.map((group) => group.ports.length > 0 && (
        <optgroup key={group.value} label={group.label}>
          {group.ports.map((port) => (
            <option key={port.id} value={port.id}>
              {port.name}
              {showMileage && port.mileageKm != null ? ` · ${port.mileageKm}km` : ''}
              {port.city ? ` · ${port.city}` : ''}
            </option>
          ))}
        </optgroup>
      ))}
      {others.length > 0 && (
        <optgroup label="其他">
          {others.map((port) => (
            <option key={port.id} value={port.id}>
              {port.name}{port.city ? ` · ${port.city}` : ''}
            </option>
          ))}
        </optgroup>
      )}
    </>
  )
}
