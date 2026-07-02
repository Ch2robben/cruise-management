import { useEffect, useState } from 'react'
import type { TemplateItinerary } from '@/types'
import { generateId } from '@/utils/format'
import { loadActivityCategoryOptions, type ActivityCategoryOption } from '@/utils/activityCategory'

type ActivityFieldKey = 'activityCategory' | 'theme' | 'startTime' | 'endTime'

interface ActivityColumn {
  key: ActivityFieldKey
  title: string
  type: 'text' | 'time' | 'select'
  widthClass: string
}

/** 活动仅配置分类、名称与时间段，不做校验，非必填 */
export const itineraryActivityColumns: ActivityColumn[] = [
  { key: 'activityCategory', title: '活动分类', type: 'select', widthClass: 'w-36' },
  { key: 'theme', title: '活动名', type: 'text', widthClass: 'w-40' },
  { key: 'startTime', title: '开始', type: 'time', widthClass: 'w-24' },
  { key: 'endTime', title: '结束', type: 'time', widthClass: 'w-24' },
]

export function formatItineraryDayLabel(day: number) {
  if (day === 0) return '启航日'
  return `第${day}天`
}

export function getItineraryDayOptions(maxDay = 14) {
  return Array.from({ length: maxDay + 1 }, (_, day) => ({
    value: day,
    label: formatItineraryDayLabel(day),
  }))
}

export interface ItineraryRow {
  row: TemplateItinerary
  idx: number
  isFirst: boolean
  span: number
}

export function createTemplateItineraryItem(seed: Partial<TemplateItinerary> = {}): TemplateItinerary {
  return {
    id: seed.id || generateId(),
    portName: seed.portName || '',
    day: typeof seed.day === 'number' ? seed.day : 0,
    arrivalTime: seed.arrivalTime || '',
    departureTime: seed.departureTime || '',
    activityCategory: seed.activityCategory || '',
    theme: seed.theme || '',
    startTime: seed.startTime || '',
    endTime: seed.endTime || '',
    description: seed.description || '',
    agency: seed.agency || '',
    attraction: seed.attraction || '',
  }
}

export function groupItineraryRows(itinerary: TemplateItinerary[]): ItineraryRow[] {
  const rows: ItineraryRow[] = []
  let i = 0

  while (i < itinerary.length) {
    const key = `${itinerary[i].portName}-${itinerary[i].day}`
    let j = i
    while (j < itinerary.length && `${itinerary[j].portName}-${itinerary[j].day}` === key) j++
    for (let k = i; k < j; k++) rows.push({ row: itinerary[k], idx: k, isFirst: k === i, span: j - i })
    i = j
  }

  return rows
}

interface ItineraryEditorProps {
  value: TemplateItinerary[]
  onChange: (next: TemplateItinerary[]) => void
  title?: string
  compact?: boolean
  emptyText?: string
  /** 仅活动列表：活动选择、开始/结束时间、备注 */
  variant?: 'full' | 'activities-only'
}

export default function ItineraryEditor({
  value,
  onChange,
  title = '航次行程',
  compact = false,
  emptyText = '暂无行程配置',
  variant = 'full',
}: ItineraryEditorProps) {
  const [categoryOptions, setCategoryOptions] = useState<ActivityCategoryOption[]>([])
  const rows = groupItineraryRows(value)
  const cellPadding = compact ? 'px-3 py-3' : 'px-2 py-2'
  const inputClass = compact
    ? 'rounded border border-gray-300 px-2 py-1 text-xs'
    : 'rounded border border-gray-300 px-1 py-1 text-xs'
  const dayOptions = getItineraryDayOptions(Math.max(14, ...value.map((item) => item.day), 0))
  const isActivitiesOnly = variant === 'activities-only'

  useEffect(() => {
    loadActivityCategoryOptions().then(setCategoryOptions)
  }, [])

  const updateItem = (idx: number, field: keyof TemplateItinerary, fieldValue: string | number) => {
    onChange(value.map((item, itemIndex) => itemIndex === idx ? { ...item, [field]: fieldValue } : item))
  }

  const updateGroupItem = (idx: number, field: 'portName' | 'day' | 'arrivalTime' | 'departureTime', fieldValue: string | number) => {
    const ref = value[idx]
    if (!ref) return

    onChange(value.map((item) => (
      item.portName === ref.portName && item.day === ref.day
        ? { ...item, [field]: fieldValue }
        : item
    )))
  }

  const addStop = () => {
    const last = value[value.length - 1]
    onChange([...value, createTemplateItineraryItem({ day: last ? last.day + 1 : 0 })])
  }

  const addActivityItem = () => {
    onChange([...value, createTemplateItineraryItem()])
  }

  const addActivity = (refIdx: number) => {
    const ref = value[refIdx]
    if (!ref) return

    let insertAt = refIdx
    while (insertAt + 1 < value.length && value[insertAt + 1].portName === ref.portName && value[insertAt + 1].day === ref.day) {
      insertAt++
    }

    const next = [...value]
    next.splice(insertAt + 1, 0, createTemplateItineraryItem({
      portName: ref.portName,
      day: ref.day,
      arrivalTime: ref.arrivalTime,
      departureTime: ref.departureTime,
    }))
    onChange(next)
  }

  const removeActivity = (idx: number) => {
    if (!isActivitiesOnly && value.length <= 1) return
    onChange(value.filter((_, itemIndex) => itemIndex !== idx))
  }

  const renderActivityCell = (row: TemplateItinerary, idx: number, column: ActivityColumn) => (
    column.type === 'select' ? (
      <select
        value={row[column.key]}
        onChange={(event) => updateItem(idx, column.key, event.target.value)}
        className={`${column.widthClass} ${inputClass}`}
      >
        <option value="">选填</option>
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={column.type}
        value={row[column.key]}
        onChange={(event) => updateItem(idx, column.key, event.target.value)}
        placeholder={column.key === 'theme' ? '选填' : ''}
        className={`${column.widthClass} ${inputClass}`}
      />
    )
  )

  const isActivityRow = (row: TemplateItinerary, groupSpan: number, isFirst: boolean) => {
    if (!isFirst) return true
    const hasActivity = Boolean(row.activityCategory || row.theme || row.startTime || row.endTime)
    return groupSpan > 1 || hasActivity
  }

  if (isActivitiesOnly) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h4>
          <button type="button" onClick={addActivityItem} className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50">+ 新增活动</button>
        </div>

        {value.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-400">{emptyText}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                  {['活动', '开始时间', '结束时间', '活动备注', '操作'].map((header) => (
                    <th key={header} className={`${cellPadding} border-b border-gray-200 text-left font-medium whitespace-nowrap`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className={`${cellPadding} border-b border-gray-100`}>
                      <select
                        value={row.activityCategory}
                        onChange={(event) => updateItem(idx, 'activityCategory', event.target.value)}
                        className={`min-w-[200px] w-full ${inputClass}`}
                      >
                        <option value="">请选择活动</option>
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`${cellPadding} border-b border-gray-100`}>
                      <input
                        type="time"
                        value={row.startTime}
                        onChange={(event) => updateItem(idx, 'startTime', event.target.value)}
                        className={`w-28 ${inputClass}`}
                      />
                    </td>
                    <td className={`${cellPadding} border-b border-gray-100`}>
                      <input
                        type="time"
                        value={row.endTime}
                        onChange={(event) => updateItem(idx, 'endTime', event.target.value)}
                        className={`w-28 ${inputClass}`}
                      />
                    </td>
                    <td className={`${cellPadding} border-b border-gray-100`}>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(event) => updateItem(idx, 'description', event.target.value)}
                        placeholder="选填"
                        className={`w-full min-w-[160px] ${inputClass}`}
                      />
                    </td>
                    <td className={`${cellPadding} border-b border-gray-100`}>
                      <button type="button" onClick={() => removeActivity(idx)} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h4>
        <button type="button" onClick={addStop} className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50">+ 添加停靠点</button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-sm text-gray-400">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                {['停靠港', '行程日', '抵港时间', '启航时间', ...itineraryActivityColumns.map((column) => column.title), '操作'].map((header) => (
                  <th key={header} className={`${cellPadding} border-b border-gray-200 text-left font-medium whitespace-nowrap`}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, idx, isFirst, span }) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {isFirst && (
                    <>
                      <td rowSpan={span} className={`${cellPadding} border-b border-r border-gray-100 bg-gray-50/60 align-middle`}>
                        <input value={row.portName} onChange={(event) => updateGroupItem(idx, 'portName', event.target.value)} className={`w-28 ${inputClass}`} placeholder="停靠港" />
                      </td>
                      <td rowSpan={span} className={`${cellPadding} border-b border-r border-gray-100 bg-gray-50/60 align-middle`}>
                        <select
                          value={row.day}
                          onChange={(event) => updateGroupItem(idx, 'day', Number(event.target.value))}
                          className={`min-w-[88px] ${inputClass}`}
                        >
                          {dayOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td rowSpan={span} className={`${cellPadding} border-b border-r border-gray-100 bg-gray-50/60 align-middle`}>
                        <input type="time" value={row.arrivalTime} onChange={(event) => updateGroupItem(idx, 'arrivalTime', event.target.value)} className={`w-24 ${inputClass}`} />
                      </td>
                      <td rowSpan={span} className={`${cellPadding} border-b border-r border-gray-100 bg-gray-50/60 align-middle`}>
                        <input type="time" value={row.departureTime} onChange={(event) => updateGroupItem(idx, 'departureTime', event.target.value)} className={`w-24 ${inputClass}`} />
                      </td>
                    </>
                  )}
                  {itineraryActivityColumns.map((column) => (
                    <td key={column.key} className={`${cellPadding} border-b border-gray-100 whitespace-nowrap`}>
                      {isActivityRow(row, span, isFirst) ? renderActivityCell(row, idx, column) : (
                        column.key === 'theme' ? <span className="text-xs text-gray-400">可添加活动</span> : null
                      )}
                    </td>
                  ))}
                  <td className={`${cellPadding} border-b border-gray-100`}>
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => addActivity(idx)} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">添加活动</button>
                      {(span > 1 || row.activityCategory || row.theme || row.startTime || row.endTime) && (
                        <button type="button" onClick={() => removeActivity(idx)} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">删除</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-400">活动为选填项，仅记录活动分类、活动名与时间段，不做校验。</p>
        </div>
      )}
    </div>
  )
}
