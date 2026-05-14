import { X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  danger,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            {loading ? '处理中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
