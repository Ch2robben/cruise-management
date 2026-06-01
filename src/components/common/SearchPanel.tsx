import type { ReactNode } from 'react'
interface SearchPanelProps {
  children: ReactNode
  onSearch: () => void
  onReset: () => void
  loading?: boolean
}

export default function SearchPanel({ children, onSearch, onReset, loading }: SearchPanelProps) {
  return (
    <div className="bg-white">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-gray-200 px-9 py-8">
        {children}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={onSearch}
            disabled={loading}
            className="h-12 min-w-[90px] rounded-md bg-blue-600 px-6 text-base font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            搜索
          </button>
          <button
            onClick={onReset}
            disabled={loading}
            className="h-12 min-w-[90px] rounded-md border border-gray-300 bg-white px-6 text-base text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  )
}
