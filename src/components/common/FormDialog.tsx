import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface FormDialogProps {
  open: boolean
  title: string
  width?: string
  loading?: boolean
  children: ReactNode
  onCancel: () => void
  onSubmit?: () => void
  submitText?: string
}

export default function FormDialog({
  open,
  title,
  width = 'max-w-xl',
  loading,
  children,
  onCancel,
  onSubmit,
  submitText = '保存',
}: FormDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${width} mx-4 max-h-[80vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

        {onSubmit && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? '保存中...' : submitText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
