import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { templateApi } from '@/mock/api'
import type { VoyageTemplate } from '@/types'
import TemplateInventoryConfigPanel from '@/components/voyage/TemplateInventoryConfigPanel'

interface TemplateInventoryConfigDialogProps {
  open: boolean
  templateId: string | null
  onClose: () => void
  onSaved?: () => void
}

export default function TemplateInventoryConfigDialog({
  open,
  templateId,
  onClose,
  onSaved,
}: TemplateInventoryConfigDialogProps) {
  const [template, setTemplate] = useState<VoyageTemplate | null>(null)

  useEffect(() => {
    if (!open || !templateId) {
      setTemplate(null)
      return
    }
    let cancelled = false
    templateApi.getById(templateId).then((t) => {
      if (!cancelled) setTemplate(t || null)
    })
    return () => {
      cancelled = true
    }
  }, [open, templateId])

  if (!open) return null

  const handleClose = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[4vh]">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative mx-4 flex max-h-[92vh] w-full max-w-7xl flex-col rounded-lg bg-white shadow-xl">
        <div className="shrink-0 border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">配置库存</h3>
              {template && (
                <p className="mt-1 text-xs text-gray-500">
                  {template.name} · {template.shipName} · {template.productName}
                </p>
              )}
            </div>
            <button type="button" onClick={handleClose} className="rounded p-1 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <TemplateInventoryConfigPanel
          templateId={templateId}
          active={open}
          onSaved={onSaved}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
