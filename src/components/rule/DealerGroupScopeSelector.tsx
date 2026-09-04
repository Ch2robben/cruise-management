import { useState } from 'react'
import { Trash2, Users } from 'lucide-react'
import { DEALER_RULE_GROUPS, type DealerRuleGroup } from '@/mock/dealerRuleGroups'

interface DealerGroupScopeSelectorProps {
  /** 当前已添加至配置区的分组ID列表 */
  selectedGroupIds: string[]
  /** 更新已添加的分组列表 */
  onChange: (groupIds: string[]) => void
}

export default function DealerGroupScopeSelector({
  selectedGroupIds,
  onChange,
}: DealerGroupScopeSelectorProps) {
  // 暂存在上方勾选区、尚未点击“添加至配置区”的分组ID
  const [checkedIds, setCheckedIds] = useState<string[]>([])

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (checkedIds.length === DEALER_RULE_GROUPS.length) {
      setCheckedIds([])
    } else {
      setCheckedIds(DEALER_RULE_GROUPS.map((g) => g.id))
    }
  }

  const handleAddToConfig = () => {
    if (checkedIds.length === 0) return
    const merged = Array.from(new Set([...selectedGroupIds, ...checkedIds]))
    onChange(merged)
    setCheckedIds([])
  }

  const handleRemoveGroup = (groupId: string) => {
    onChange(selectedGroupIds.filter((id) => id !== groupId))
  }

  // 匹配已选中的分组详情
  const selectedGroups = DEALER_RULE_GROUPS.filter((g) =>
    selectedGroupIds.includes(g.id)
  )

  return (
    <div className="space-y-5">
      {/* 1. 适用范围选择区（对应原截图红框部分） */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          适用范围
        </h4>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-800">
                分销商分组（可多选）
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {checkedIds.length === DEALER_RULE_GROUPS.length ? '取消全选' : '全选'}
              </button>
            </div>

            <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
              {DEALER_RULE_GROUPS.map((group: DealerRuleGroup) => {
                const isChecked = checkedIds.includes(group.id)
                const isAlreadyInCart = selectedGroupIds.includes(group.id)

                return (
                  <label
                    key={group.id}
                    className={`flex items-start justify-between gap-3 rounded-md border p-2.5 transition cursor-pointer ${
                      isChecked
                        ? 'border-blue-300 bg-blue-50/40'
                        : isAlreadyInCart
                        ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(group.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {group.name}
                          </span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-gray-600">
                            {group.code}
                          </span>
                          {isAlreadyInCart && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700 font-medium">
                              已在配置区
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">{group.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 mt-0.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{group.dealerCount} 家分销商</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            可选多个分销商分组，添加后进入下方配置区；多选分组共用同一套规则配置，不关联产品与房型。
          </p>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleAddToConfig}
              disabled={checkedIds.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 transition"
            >
              添加至配置区 {checkedIds.length > 0 && `(${checkedIds.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* 2. 配置区中的已选范围（展示购物车与移除操作） */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800">
            已选范围（{selectedGroups.length} 个分销商分组）
          </span>
          {selectedGroups.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-red-500 hover:text-red-700"
            >
              清空已选分组
            </button>
          )}
        </div>

        {selectedGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-400">
            请先选择分销商分组并添加至配置区
          </div>
        ) : (
          <div className="space-y-2">
            {selectedGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-gray-300"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                    {group.code.replace('GRP-', '')}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{group.name}</span>
                      <span className="text-xs text-gray-400">({group.dealerCount}家分销商)</span>
                    </div>
                    <span className="text-xs text-gray-500">{group.description}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group.id)}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>移除</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
