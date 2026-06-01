import type { TemplateItinerary } from '@/types'
import { generateId } from '@/utils/format'

export const itineraryThemeOptions = ['用餐', '讲座', '表演', '景点']
export const itineraryAgencyOptions = ['中青旅', '春秋旅游', '携程国旅', '康辉旅游', '众信旅游']

type ActivityFieldKey = 'theme' | 'startTime' | 'endTime' | 'description' | 'agency' | 'attraction'

interface ActivityColumn {
  key: ActivityFieldKey
  title: string
  type: 'text' | 'time' | 'select'
  options?: string[]
  widthClass: string
}

export const itineraryActivityColumns: ActivityColumn[] = [
  { key: 'theme', title: '主题', type: 'select', options: itineraryThemeOptions, widthClass: 'w-24' },
  { key: 'startTime', title: '开始', type: 'time', widthClass: 'w-24' },
  { key: 'endTime', title: '结束', type: 'time', widthClass: 'w-24' },
  { key: 'description', title: '行程说明', type: 'text', widthClass: 'w-56' },
  { key: 'agency', title: '地接社', type: 'select', options: itineraryAgencyOptions, widthClass: 'w-32' },
  { key: 'attraction', title: '景点', type: 'text', widthClass: 'w-32' },
]

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
}

export default function ItineraryEditor({
  value,
  onChange,
  title = '航次行程',
  compact = false,
  emptyText = '暂无行程配置',
}: ItineraryEditorProps) {
  const rows = groupItineraryRows(value)
  const cellPadding = compact ? 'px-3 py-3' : 'px-2 py-2'
  const inputClass = compact
    ? 'rounded border border-gray-300 px-2 py-1 text-xs'
    : 'rounded border border-gray-300 px-1 py-1 text-xs'

  const updateItem = (idx: number, field: keyof TemplateItinerary, fieldValue: string | number) => {
    onChange(value.map((item, itemIndex) => itemIndex === idx ? { ...item, [field]: fieldValue } : item))
  }

  const updateGroupItem = (idx: number, field: 'portName' | 'day' | 'arrivalTime' | 'departureTime', fieldValue: string | number) => {
    const ref = value[idx]
    if (!ref) return

    onChange(value.map(item => (
      item.portName === ref.portName && item.day === ref.day
        ? { ...item, [field]: fieldValue }
        : item
    )))
  }

  const addStop = () => {
    const last = value[value.length - 1]
    onChange([...value, createTemplateItineraryItem({ day: last ? last.day + 1 : 1 })])
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
    onChange(value.filter((_, itemIndex) => itemIndex !== idx))
  }

  const renderActivityCell = (row: TemplateItinerary, idx: number, column: ActivityColumn) => {
    if (column.type === 'select') {
      return (
        <select
          value={row[column.key]}
          onChange={(event) => updateItem(idx, column.key, event.target.value)}
          className={`${column.widthClass} ${inputClass}`}
        >
          <option value="">-</option>
          {column.options?.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      )
    }

    return (
      <input
        type={column.type}
        value={row[column.key]}
        onChange={(event) => updateItem(idx, column.key, event.target.value)}
        className={`${column.widthClass} ${inputClass}`}
      />
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
                {['停靠港', '天数', '抵港', '离港', ...itineraryActivityColumns.map(column => column.title), '操作'].map(header => (
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
                        <input value={row.portName} onChange={(event) => updateGroupItem(idx, 'portName', event.target.value)} className={`w-28 ${inputClass}`} />
                      </td>
                      <td rowSpan={span} className={`${cellPadding} border-b border-r border-gray-100 bg-gray-50/60 align-middle`}>
                        <input type="number" value={row.day || ''} onChange={(event) => updateGroupItem(idx, 'day', Number(event.target.value))} className={`w-16 ${inputClass}`} />
                      </td>
                      <td rowSpan={span} className={`${cellPadding} border-b border-r border-gray-100 bg-gray-50/60 align-middle`}>
                        <input type="time" value={row.arrivalTime} onChange={(event) => updateGroupItem(idx, 'arrivalTime', event.target.value)} className={`w-24 ${inputClass}`} />
                      </td>
                      <td rowSpan={span} className={`${cellPadding} border-b border-r border-gray-100 bg-gray-50/60 align-middle`}>
                        <input type="time" value={row.departureTime} onChange={(event) => updateGroupItem(idx, 'departureTime', event.target.value)} className={`w-24 ${inputClass}`} />
                      </td>
                    </>
                  )}
                  {itineraryActivityColumns.map(column => (
                    <td key={column.key} className={`${cellPadding} border-b border-gray-100 whitespace-nowrap`}>
                      {renderActivityCell(row, idx, column)}
                    </td>
                  ))}
                  <td className={`${cellPadding} border-b border-gray-100`}>
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => addActivity(idx)} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">添加</button>
                      <button type="button" onClick={() => removeActivity(idx)} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">删除</button>
                    </div>
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
