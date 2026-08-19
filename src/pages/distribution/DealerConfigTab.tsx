import { useMemo, useState } from 'react'
import FormDialog from '@/components/common/FormDialog'
import { MultiCheckField } from '@/components/common/SelectField'
import {
  dealerConfigDealers,
  dealerPolicyTypeOptions,
  formatPolicyTypeNames,
  formatRegionNames,
  getDealerConfig,
  regionPolicyEffectiveRegions,
  saveDealerConfig,
  type DealerChannelKind,
  type DealerConfig,
} from '@/mock/dealerConfigs'

const channelOptions: { value: DealerChannelKind; label: string; hint: string }[] = [
  { value: 'non_ota', label: '非OTA', hint: '同业/组团社，按区域价或全域价结算' },
  { value: 'ota', label: 'OTA', hint: '平台渠道，走 OTA 价与渠道对接' },
]

export default function DealerConfigTab() {
  const [keyword, setKeyword] = useState('')
  const [rows, setRows] = useState<DealerConfig[]>(() =>
    dealerConfigDealers.map((dealer) => getDealerConfig(dealer.id)),
  )
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<DealerConfig | null>(null)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const filtered = useMemo(() => {
    const kw = keyword.trim()
    return rows.filter((row) => !kw || row.dealerName.includes(kw) || row.groupName.includes(kw))
  }, [keyword, rows])

  const openConfig = (row: DealerConfig) => {
    setForm({ ...row, policyTypeIds: [...row.policyTypeIds], regionCodes: [...row.regionCodes] })
    setFormError('')
    setFormOpen(true)
  }

  const setChannelKind = (channelKind: DealerChannelKind) => {
    if (!form) return
    const policyTypeIds = [...form.policyTypeIds]
    if (channelKind === 'ota' && !policyTypeIds.includes('ota')) policyTypeIds.push('ota')
    if (channelKind === 'non_ota') {
      const idx = policyTypeIds.indexOf('ota')
      if (idx >= 0) policyTypeIds.splice(idx, 1)
    }
    setForm({ ...form, channelKind, policyTypeIds })
  }

  const handleSubmit = () => {
    if (!form) return
    if (form.policyTypeIds.length === 0) {
      setFormError('请至少选择一种价格政策类型')
      return
    }
    const next = saveDealerConfig(form)
    setRows((prev) => prev.map((row) => (row.dealerId === next.dealerId ? next : row)))
    setFormOpen(false)
    showToast('分销商配置已保存')
  }

  const domesticOptions = regionPolicyEffectiveRegions
    .filter((item) => item.scope === 'domestic')
    .map((item) => ({ value: item.code, label: `${item.pathLabel}（${item.sourcePolicy}）` }))
  const overseasOptions = regionPolicyEffectiveRegions
    .filter((item) => item.scope === 'overseas')
    .map((item) => ({ value: item.code, label: `${item.pathLabel}（${item.sourcePolicy}）` }))

  return (
    <div>
      {toast && (
        <div className="fixed left-1/2 top-6 z-[999] -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索分销商名称 / 分组"
          className="h-9 w-64 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">分销商名称</th>
              <th className="px-4 py-3 text-left font-medium">分组</th>
              <th className="px-4 py-3 text-center font-medium">类型</th>
              <th className="px-4 py-3 text-left font-medium">可用政策类型</th>
              <th className="px-4 py-3 text-left font-medium">可用区域</th>
              <th className="px-4 py-3 text-left font-medium">最近保存</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  暂无匹配的分销商
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.dealerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.dealerName}</td>
                  <td className="px-4 py-3 text-gray-700">{row.groupName}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.channelKind === 'ota' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.channelKind === 'ota' ? 'OTA' : '非OTA'}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-gray-700" title={formatPolicyTypeNames(row.policyTypeIds)}>
                    {formatPolicyTypeNames(row.policyTypeIds)}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-gray-700" title={formatRegionNames(row.regionCodes)}>
                    {formatRegionNames(row.regionCodes)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.updatedAt}</td>
                  <td className="px-4 py-3 text-center">
                    <button type="button" onClick={() => openConfig(row)} className="text-xs text-blue-600 hover:text-blue-700">
                      配置
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">可用区域仅能从「分销管理 → 价格政策」中区域价已配置的生效区域选择。</p>

      <FormDialog
        open={formOpen && !!form}
        title={form ? `分销商配置 · ${form.dealerName}` : '分销商配置'}
        width="max-w-3xl"
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        submitText="保存"
      >
        {form && (
          <div className="space-y-5">
            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
            )}

            <div>
              <div className="mb-1 text-sm text-gray-700">
                经销商类型 <span className="text-red-500">*</span>
              </div>
              <p className="mb-2 text-xs text-gray-400">切换为 OTA 时会自动勾选「OTA价」。</p>
              <div className="grid grid-cols-2 gap-3">
                {channelOptions.map((option) => {
                  const active = form.channelKind === option.value
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 ${
                        active ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="channelKind"
                        checked={active}
                        onChange={() => setChannelKind(option.value)}
                        className="mt-0.5 accent-gray-900"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">{option.hint}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-700">
                可用价格政策类型 <span className="text-red-500">*</span>
              </label>
              <p className="mb-2 text-xs text-gray-400">选项来自「分销管理 → 价格政策」，下单时仅匹配已勾选类型。</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs text-gray-500">预定类型</div>
                  <MultiCheckField
                    value={form.policyTypeIds}
                    options={dealerPolicyTypeOptions
                      .filter((item) => item.group === '预定类型')
                      .map((item) => ({ value: item.id, label: item.name }))}
                    onChange={(policyTypeIds) => setForm({ ...form, policyTypeIds })}
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs text-gray-500">计价类型</div>
                  <MultiCheckField
                    value={form.policyTypeIds}
                    options={dealerPolicyTypeOptions
                      .filter((item) => item.group === '计价类型')
                      .map((item) => ({ value: item.id, label: item.name }))}
                    onChange={(policyTypeIds) => setForm({ ...form, policyTypeIds })}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-700">可用区域</label>
              <p className="mb-2 text-xs text-gray-400">
                可选区域来自区域政策（区域价）已配置的生效区域。不选表示不额外限制。
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs text-gray-500">境内</div>
                  <MultiCheckField
                    value={form.regionCodes}
                    options={domesticOptions}
                    onChange={(regionCodes) => setForm({ ...form, regionCodes })}
                    className="max-h-48 overflow-y-auto"
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs text-gray-500">境外</div>
                  <MultiCheckField
                    value={form.regionCodes}
                    options={overseasOptions}
                    onChange={(regionCodes) => setForm({ ...form, regionCodes })}
                    className="max-h-48 overflow-y-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  )
}
