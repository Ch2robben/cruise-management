import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import {
  flatDomesticRegions,
  flatOverseasRegions,
  matchRegionKeyword,
  type FlatPolicyRegion,
  type RegionScopeKind,
} from '@/mock/pricePolicyRegions'

export interface SelectedPolicyRegion {
  code: string
  label: string
  pathLabel: string
  path: string[]
  scope: RegionScopeKind
}

interface PolicyRegionPickerProps {
  scope: RegionScopeKind
  value: SelectedPolicyRegion[]
  onChange: (next: SelectedPolicyRegion[]) => void
}

function toSelected(region: FlatPolicyRegion): SelectedPolicyRegion {
  return {
    code: region.code,
    label: region.label,
    pathLabel: region.pathLabel,
    path: region.path,
    scope: region.scope,
  }
}

export default function PolicyRegionPicker({ scope, value, onChange }: PolicyRegionPickerProps) {
  const [keyword, setKeyword] = useState('')
  const catalog = scope === 'domestic' ? flatDomesticRegions : flatOverseasRegions
  const maxLevel = scope === 'domestic' ? 3 : 2

  const filtered = useMemo(
    () => catalog.filter((item) => matchRegionKeyword(item, keyword)).slice(0, 80),
    [catalog, keyword],
  )

  const selectedCodes = useMemo(() => new Set(value.map((item) => item.code)), [value])

  const toggle = (region: FlatPolicyRegion) => {
    if (selectedCodes.has(region.code)) {
      onChange(value.filter((item) => item.code !== region.code))
      return
    }
    onChange([...value, toSelected(region)])
  }

  const remove = (code: string) => {
    onChange(value.filter((item) => item.code !== code))
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={
            scope === 'domestic'
              ? '搜索省/市/区，支持拼音首字母（如 cq、hb、yc）'
              : '搜索洲/国家/港澳台，支持拼音首字母（如 rb、xg、mg）'
          }
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={`${item.scope}-${item.code}`}
              className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs text-purple-700"
            >
              <span className="font-mono text-[10px] text-purple-500">{item.code}</span>
              {item.pathLabel}
              <button
                type="button"
                onClick={() => remove(item.code)}
                className="rounded-full p-0.5 hover:bg-purple-100"
                aria-label={`移除 ${item.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-52 overflow-y-auto rounded-md border border-gray-100">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-gray-400">无匹配区域</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filtered.map((region) => {
              const checked = selectedCodes.has(region.code)
              const indent = Math.min(region.level - 1, maxLevel - 1)
              return (
                <li key={`${region.scope}-${region.code}-${region.pathLabel}`}>
                  <button
                    type="button"
                    onClick={() => toggle(region)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      checked ? 'bg-purple-50/60' : ''
                    }`}
                    style={{ paddingLeft: `${12 + indent * 14}px` }}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                        checked
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : 'border-gray-300 bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1 font-medium text-gray-900">{region.label}</span>
                    <span className="shrink-0 font-mono text-[10px] text-gray-400">{region.code}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <p className="text-[11px] text-gray-400">
        {scope === 'domestic'
          ? '可按省、市或区勾选；匹配时按身份证前六位区划码命中。'
          : '可按洲或国家/港澳台勾选；匹配时按护照属地命中。'}
      </p>
    </div>
  )
}
