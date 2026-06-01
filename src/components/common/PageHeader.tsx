import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[32px] font-semibold text-gray-900">{title}</h2>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
