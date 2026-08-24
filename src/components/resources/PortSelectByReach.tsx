import type { Port } from '@/types'

const sortPortsByName = (list: Port[]) =>
  [...list].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

interface PortSelectByReachProps {
  ports: Port[]
}

export default function PortSelectByReach({ ports }: PortSelectByReachProps) {
  return (
    <>
      {sortPortsByName(ports).map((port) => (
        <option key={port.id} value={port.id}>
          {port.name}
        </option>
      ))}
    </>
  )
}
