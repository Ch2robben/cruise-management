import type { ReactNode } from 'react'
import { Search, RotateCcw } from 'lucide-react'

interface SearchPanelProps {
  children: ReactNode
  onSearch: () => void
  onReset: () => void
  loading?: boolean
}

export default function SearchPanel({ children, onSearch, onReset, loading }: SearchPanelProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex flex-wrap gap-3 items-end">
        {children}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onSearch}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            查询
          </button>
          <button
            onClick={onReset}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>
    </div>
  )
}
