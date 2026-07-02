import { useEffect, useMemo, useState } from 'react'
import { templateApi, voyageApi } from '@/mock/api'
import type { Voyage, VoyageTemplate } from '@/types'
import FormDialog from '@/components/common/FormDialog'

const statusLabels: Record<string, string> = {
  ticketing: '售票',
  suspended: '停航',
  chartered: '包租',
  deadhead: '空放',
  pending: '待定',
  transfer: '转船',
}

interface TemplateLinkVoyageDialogProps {
  open: boolean
  templateId: string | null
  onClose: () => void
  onSaved?: () => void
}

export default function TemplateLinkVoyageDialog({
  open,
  templateId,
  onClose,
  onSaved,
}: TemplateLinkVoyageDialogProps) {
  const [template, setTemplate] = useState<VoyageTemplate | null>(null)
  const [voyages, setVoyages] = useState<Voyage[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !templateId) {
      setTemplate(null)
      setVoyages([])
      setSelectedIds(new Set())
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      templateApi.getById(templateId),
    ]).then(async ([templateResult]) => {
      if (cancelled) return
      setTemplate(templateResult || null)
      if (!templateResult?.productId) {
        setVoyages([])
        setSelectedIds(new Set())
        return
      }
      const result = await voyageApi.list({ productId: templateResult.productId, pageSize: 200 })
      if (cancelled) return
      setVoyages(result.data)
      setSelectedIds(new Set(result.data.filter((item) => item.templateId === templateId).map((item) => item.id)))
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [open, templateId])

  const linkedCount = useMemo(
    () => voyages.filter((item) => item.templateId === templateId).length,
    [templateId, voyages],
  )

  const toggleVoyage = (voyageId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(voyageId)) next.delete(voyageId)
      else next.add(voyageId)
      return next
    })
  }

  const handleSave = async () => {
    if (!template) return
    setSaving(true)
    await voyageApi.batchLinkTemplate(template.id, template.name, Array.from(selectedIds))
    setSaving(false)
    onSaved?.()
    onClose()
  }

  return (
    <FormDialog
      open={open}
      title="关联航次"
      width="max-w-3xl"
      loading={saving}
      submitText="保存关联"
      onCancel={onClose}
      onSubmit={handleSave}
    >
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">加载中...</div>
      ) : !template ? (
        <div className="py-12 text-center text-sm text-gray-400">未找到模板信息</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p><span className="text-gray-500">模板：</span>{template.name}</p>
            <p className="mt-1"><span className="text-gray-500">关联产品：</span>{template.productName}</p>
            <p className="mt-1 text-xs text-gray-500">
              仅展示同产品下的航次；已关联 {linkedCount} 个，当前选中 {selectedIds.size} 个。
            </p>
          </div>

          {voyages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
              该产品下暂无可关联航次
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                    <th className="w-12 px-3 py-2.5 text-center font-medium">选择</th>
                    <th className="px-3 py-2.5 text-left font-medium">航次编号</th>
                    <th className="px-3 py-2.5 text-left font-medium">开航日期</th>
                    <th className="px-3 py-2.5 text-left font-medium">状态</th>
                    <th className="px-3 py-2.5 text-left font-medium">当前模板</th>
                  </tr>
                </thead>
                <tbody>
                  {voyages.map((voyage) => {
                    const checked = selectedIds.has(voyage.id)
                    const linkedOther = Boolean(voyage.templateId && voyage.templateId !== template.id)
                    return (
                      <tr key={voyage.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleVoyage(voyage.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-medium text-gray-900">{voyage.voyageNo}</td>
                        <td className="px-3 py-2.5 text-gray-700">{voyage.startDate}</td>
                        <td className="px-3 py-2.5 text-gray-700">{statusLabels[voyage.status] || voyage.status}</td>
                        <td className="px-3 py-2.5 text-gray-600">
                          {voyage.templateId === template.id
                            ? <span className="text-emerald-600">本模板</span>
                            : voyage.templateName
                              ? <span className={linkedOther ? 'text-amber-600' : ''}>{voyage.templateName}</span>
                              : <span className="text-gray-400">未关联</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-gray-500">
            保存后，选中航次将继承本模板的价格/库存配置；取消勾选的航次将解除与本模板的关联。
          </p>
        </div>
      )}
    </FormDialog>
  )
}
