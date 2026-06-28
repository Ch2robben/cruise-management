import { X } from 'lucide-react'
import type { Voyage } from '@/types'
import TemplateInventoryConfigPanel from '@/components/voyage/TemplateInventoryConfigPanel'

export interface InventoryConfigContext {
  mode: 'single' | 'batch'
  voyages: Voyage[]
}

interface InventoryConfigDialogProps {
  context: InventoryConfigContext
  onClose: () => void
  onSave?: () => void
}

export default function InventoryConfigDialog({ context, onClose, onSave }: InventoryConfigDialogProps) {
  const primaryVoyage = context.voyages[0]

  const title = context.mode === 'batch'
    ? `批量库存配置 · 已选 ${context.voyages.length} 个航次`
    : `库存配置 · ${primaryVoyage?.voyageNo || ''}`

  const meta = context.mode === 'batch'
    ? '批量模式下展示首个航次关联模板作为配置预览，保存后将应用到模板（mock）'
    : `${primaryVoyage?.productName || ''} · ${primaryVoyage?.startDate || ''}`

  const batchHint = context.mode === 'batch'
    ? `批量模式：以首个航次「${primaryVoyage?.voyageNo || ''}」关联的航次模板为预览，保存后同步至该模板。`
    : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[4vh]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-xs text-gray-500">{meta}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-4 gap-3 border-b bg-gray-50/80 px-6 py-3">
          <ReadonlyField label="产品" value={primaryVoyage?.productName || '-'} />
          <ReadonlyField label="适用游轮" value={primaryVoyage?.shipName || '-'} />
          <ReadonlyField label="航次模板" value={primaryVoyage?.templateName || '-'} />
          <ReadonlyField
            label="配置范围"
            value={context.mode === 'batch' ? `已选 ${context.voyages.length} 个航次` : '单航次'}
          />
        </div>

        <TemplateInventoryConfigPanel
          templateId={primaryVoyage?.templateId || null}
          active
          embedded
          batchHint={batchHint}
          onSaved={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] text-gray-500">{label}</label>
      <input
        value={value}
        disabled
        className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
      />
    </div>
  )
}
