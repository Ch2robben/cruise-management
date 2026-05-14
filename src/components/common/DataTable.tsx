import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface Column<T> {
  key: string
  title: string
  dataIndex?: keyof T | string
  width?: string
  render?: (record: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  dataSource: T[]
  loading?: boolean
  rowKey?: keyof T | ((record: T) => string)
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number) => void
  }
  emptyText?: string
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  dataSource,
  loading,
  rowKey,
  pagination,
  emptyText = '暂无数据',
}: DataTableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(record)
    if (typeof rowKey === 'string') return String(record[rowKey] ?? index)
    if ('id' in record) return String(record.id)
    return String(index)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">加载中...</span>
                  </div>
                </td>
              </tr>
            ) : dataSource.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              dataSource.map((record, index) => (
                <tr key={getRowKey(record, index)} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">
                      {col.render
                        ? col.render(record)
                        : col.dataIndex
                          ? String(record[col.dataIndex as keyof T] ?? '-')
                          : '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-500">
            共 {pagination.total} 条，第 {pagination.current}/{Math.ceil(pagination.total / pagination.pageSize)} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onChange(pagination.current - 1)}
              disabled={pagination.current <= 1}
              className="p-1.5 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.pageSize)) }, (_, i) => {
              const totalPages = Math.ceil(pagination.total / pagination.pageSize)
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.current <= 3) {
                pageNum = i + 1
              } else if (pagination.current >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = pagination.current - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onChange(pageNum)}
                  className={`w-8 h-8 rounded text-sm ${
                    pageNum === pagination.current
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => pagination.onChange(pagination.current + 1)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              className="p-1.5 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
