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

export default function DataTable<T>({
  columns,
  dataSource,
  loading,
  rowKey,
  pagination,
  emptyText = '暂无数据',
}: DataTableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(record)
    if (typeof rowKey === 'string') return String((record as Record<string, unknown>)[rowKey] ?? index)
    if ('id' in (record as Record<string, unknown>)) return String((record as Record<string, unknown>).id)
    return String(index)
  }

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1
  const pageNumbers = pagination
    ? Array.from({ length: totalPages }, (_, index) => index + 1).slice(
        Math.max(0, Math.min(pagination.current - 3, totalPages - 5)),
        Math.max(0, Math.min(pagination.current - 3, totalPages - 5)) + Math.min(5, totalPages),
      )
    : []

  return (
    <div className="overflow-hidden border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="border-b border-r border-gray-200 px-4 py-4 text-left text-[15px] font-semibold text-gray-800 last:border-r-0"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-20 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">加载中...</span>
                  </div>
                </td>
              </tr>
            ) : dataSource.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-20 text-center text-sm text-gray-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              dataSource.map((record, index) => (
                <tr key={getRowKey(record, index)} className="transition hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700 whitespace-nowrap last:border-r-0">
                      {col.render
                        ? col.render(record)
                        : col.dataIndex
                          ? String((record as Record<string, unknown>)[col.dataIndex as string] ?? '-')
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
        <div className="flex flex-wrap items-center justify-between gap-4 px-9 py-10 text-gray-500">
          <span className="text-[15px]">
            共 {pagination.total} 条记录 第 {pagination.current} / {totalPages} 页
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => pagination.onChange(pagination.current - 1)}
                disabled={pagination.current <= 1}
                className="flex h-12 w-12 items-center justify-center rounded border border-gray-200 bg-white text-sm transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => pagination.onChange(pageNum)}
                  className={`flex h-12 w-12 items-center justify-center rounded border text-lg transition ${
                    pageNum === pagination.current
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-blue-500 hover:text-blue-600'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => pagination.onChange(pagination.current + 1)}
                disabled={pagination.current >= totalPages}
                className="flex h-12 w-12 items-center justify-center rounded border border-gray-200 bg-white text-sm transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              className="flex h-12 min-w-[110px] items-center justify-center rounded border border-gray-200 bg-white px-4 text-lg text-gray-500"
            >
              {pagination.pageSize}条/页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
