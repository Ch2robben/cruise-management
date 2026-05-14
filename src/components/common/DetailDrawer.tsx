import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface DetailDrawerProps {
  open: boolean
  title: string
  width?: string
  children: ReactNode
  onClose: () => void
}

export default function DetailDrawer({ open, title, width = 'w-[640px]', children, onClose }: DetailDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`relative bg-white h-full ${width} max-w-full shadow-xl flex flex-col animate-slide-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

// 详情卡片
export function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-gray-50/50 rounded-lg p-4 mb-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  )
}

// 详情行
export function DetailRow({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex py-1.5 text-sm">
      <span className="w-28 text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-900 ${mono ? 'font-mono' : ''}`}>{value ?? '-'}</span>
    </div>
  )
}
