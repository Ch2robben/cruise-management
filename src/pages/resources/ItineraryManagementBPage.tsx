import { useMemo, useState } from 'react'
import {
  BedDouble,
  Bus,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock3,
  GripVertical,
  Hotel,
  MapPin,
  MoreHorizontal,
  Palmtree,
  Plane,
  Plus,
  Save,
  Ship,
  Sparkles,
  TrainFront,
  Trash2,
  Utensils,
  Users,
  X,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'

type ActivityType = '登船' | '餐饮' | '酒店' | '景点' | '自由活动' | '交通' | '集合' | '航班' | '火车' | '其他'

interface Activity {
  id: number
  type: ActivityType
  title: string
  timeMode: '全天' | '上午' | '下午' | '晚上' | '具体时间'
  time?: string
  address?: string
  note?: string
  mealType?: '早餐' | '午餐' | '晚餐' | '全天餐饮'
  feeIncluded?: boolean
}

export interface DayPlan {
  day: number
  title: string
  highlight: string
  activities: Activity[]
}

const activityMeta: Record<ActivityType, { icon: typeof Ship; color: string; soft: string }> = {
  登船: { icon: Ship, color: 'text-blue-600', soft: 'bg-blue-50' },
  餐饮: { icon: Utensils, color: 'text-orange-600', soft: 'bg-orange-50' },
  酒店: { icon: Hotel, color: 'text-indigo-600', soft: 'bg-indigo-50' },
  景点: { icon: Palmtree, color: 'text-emerald-600', soft: 'bg-emerald-50' },
  自由活动: { icon: Sparkles, color: 'text-rose-500', soft: 'bg-rose-50' },
  交通: { icon: Bus, color: 'text-cyan-600', soft: 'bg-cyan-50' },
  集合: { icon: Users, color: 'text-amber-600', soft: 'bg-amber-50' },
  航班: { icon: Plane, color: 'text-sky-600', soft: 'bg-sky-50' },
  火车: { icon: TrainFront, color: 'text-slate-600', soft: 'bg-slate-100' },
  其他: { icon: MoreHorizontal, color: 'text-gray-600', soft: 'bg-gray-100' },
}

const initialPlans: DayPlan[] = Array.from({ length: 11 }, (_, index) => ({
  day: index + 1,
  title:
    index === 0
      ? '重庆朝天门码头登船 → 长江叁号 → 游轮安全说明会 → 游轮启航 → 船长欢迎酒会'
      : `长江叁号第 ${index + 1} 天行程`,
  highlight: index === 0 ? '赠送登船豪华晚餐，行李搬运服务' : '',
  activities:
    index === 0
      ? [
          {
            id: 1,
            type: '登船',
            title: '重庆朝天门码头登船',
            timeMode: '具体时间',
            time: '19:00',
            address: '朝天门码头（中国，重庆，渝中区）',
            note: '请至少提前 60 分钟抵达码头办理登船手续。',
          },
          {
            id: 2,
            type: '餐饮',
            title: '登船欢迎晚餐',
            timeMode: '全天',
            mealType: '全天餐饮',
            feeIncluded: true,
            note: '餐厅开放时间以船上当日通知为准。',
          },
        ]
      : [],
}))

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

interface ItineraryManagementBPageProps {
  embedded?: boolean
  itineraryName?: string
  routeName?: string
  onBack?: () => void
  onComplete?: (plans: DayPlan[]) => void
}

export default function ItineraryManagementBPage({
  embedded = false,
  itineraryName = '长江叁号 · 重庆至上海 11 日游',
  routeName = '',
  onBack,
  onComplete,
}: ItineraryManagementBPageProps = {}) {
  const [plans, setPlans] = useState(initialPlans)
  const [activeDay, setActiveDay] = useState(1)
  const [activityPickerOpen, setActivityPickerOpen] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [preview, setPreview] = useState(false)
  const [toast, setToast] = useState('')

  const plan = useMemo(() => plans.find((item) => item.day === activeDay)!, [plans, activeDay])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  const updatePlan = (patch: Partial<DayPlan>) => {
    setPlans((current) => current.map((item) => (item.day === activeDay ? { ...item, ...patch } : item)))
  }

  const updateActivity = (id: number, patch: Partial<Activity>) => {
    updatePlan({
      activities: plan.activities.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })
  }

  const addActivity = (type: ActivityType) => {
    updatePlan({
      activities: [
        ...plan.activities,
        {
          id: Date.now(),
          type,
          title: type === '餐饮' ? '用餐安排' : `${type}安排`,
          timeMode: '全天',
          ...(type === '餐饮' ? { mealType: '全天餐饮' as const, feeIncluded: true } : {}),
        },
      ],
    })
    setActivityPickerOpen(false)
    showToast(`已添加${type}节点`)
  }

  const deleteActivity = (id: number) => {
    updatePlan({ activities: plan.activities.filter((item) => item.id !== id) })
    showToast('活动节点已删除')
  }

  return (
    <div className="min-w-[980px]">
      {toast && (
        <div className="fixed left-1/2 top-6 z-[80] flex -translate-x-1/2 items-center gap-2 rounded bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
          <Check className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {!embedded && (
        <PageHeader title="行程管理B">
          <button
            onClick={() => setPreview((value) => !value)}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {preview ? '返回编辑' : '预览'}
          </button>
          <button
            onClick={() => showToast('行程方案已保存')}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            保存行程
          </button>
        </PageHeader>
      )}

      <div className="mb-4 flex items-center justify-between rounded border border-gray-200 bg-white px-5 py-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-gray-900">{itineraryName}</span>
            {routeName && <span className="text-sm text-gray-500">· {routeName}</span>}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            审核状态
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-gray-700">审核通过</span>
            <span className="mx-1 text-gray-300">|</span>
            共 11 天 · 已配置 {plans.filter((item) => item.activities.length > 0).length} 天
          </div>
        </div>
        <div className="flex items-center">
          {embedded && (
            <>
              <button onClick={onBack} className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                上一步
              </button>
              <button
                onClick={() => onComplete?.(plans)}
                className="ml-2 flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                完成并保存
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex min-h-[680px] gap-4 rounded border border-gray-200 bg-white p-4 shadow-sm">
        <aside className="w-[82px] shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
          {plans.map((item) => (
            <button
              key={item.day}
              onClick={() => setActiveDay(item.day)}
              className={`flex w-full items-center gap-1 border-b border-gray-200 px-2 py-3 text-sm transition ${
                activeDay === item.day ? 'border-l-4 border-l-blue-500 bg-blue-50 font-semibold text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <GripVertical className="h-3.5 w-3.5 text-gray-400" />
              D{item.day}
            </button>
          ))}
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="text-xl font-semibold text-gray-900">D{activeDay}</h3>
            <button onClick={() => setExpanded((value) => !value)} className="flex items-center gap-1 text-sm text-blue-600">
              {expanded ? '收起' : '展开'}
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {preview ? (
            <Preview plan={plan} />
          ) : (
            <>
              <div className="grid grid-cols-[84px_1fr] items-start gap-x-3 gap-y-3">
                <label className="pt-2 text-right text-sm text-gray-600">标题</label>
                <div className="relative">
                  <textarea
                    value={plan.title}
                    onChange={(event) => updatePlan({ title: event.target.value.slice(0, 100) })}
                    rows={2}
                    className={`${inputClass} resize-none pr-16`}
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">{plan.title.length}/100</span>
                </div>
                <label className="pt-2 text-right text-sm text-gray-600">行程亮点</label>
                <div className="relative">
                  <textarea
                    value={plan.highlight}
                    onChange={(event) => updatePlan({ highlight: event.target.value.slice(0, 50) })}
                    rows={2}
                    placeholder="请输入当日行程亮点"
                    className={`${inputClass} resize-none pr-16`}
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">{plan.highlight.length}/50</span>
                </div>
              </div>

              {expanded && (
                <div className="relative ml-10 mt-7 border-l border-dashed border-blue-200 pl-8">
                  {plan.activities.length === 0 && (
                    <div className="mb-5 rounded border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center text-sm text-gray-400">
                      当前日期暂无行程节点，请点击下方“添加行程节点”
                    </div>
                  )}
                  {plan.activities.map((activity) => (
                    <ActivityEditor
                      key={activity.id}
                      activity={activity}
                      onChange={(patch) => updateActivity(activity.id, patch)}
                      onDelete={() => deleteActivity(activity.id)}
                    />
                  ))}

                  <div className="relative">
                    <button
                      onClick={() => setActivityPickerOpen((value) => !value)}
                      className="absolute -left-[45px] top-0 flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
                      aria-label="添加行程节点"
                    >
                      {activityPickerOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setActivityPickerOpen((value) => !value)} className="text-sm text-blue-600 hover:text-blue-700">
                      添加行程节点
                    </button>
                    {activityPickerOpen && (
                      <div className="mt-3 grid w-[520px] grid-cols-5 overflow-hidden rounded border border-gray-200 bg-white shadow-lg">
                        {(Object.keys(activityMeta) as ActivityType[]).map((type) => {
                          const meta = activityMeta[type]
                          const Icon = meta.icon
                          return (
                            <button
                              key={type}
                              onClick={() => addActivity(type)}
                              className="flex flex-col items-center gap-2 border-b border-r border-gray-100 px-4 py-4 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Icon className={`h-5 w-5 ${meta.color}`} />
                              {type}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function ActivityEditor({
  activity,
  onChange,
  onDelete,
}: {
  activity: Activity
  onChange: (patch: Partial<Activity>) => void
  onDelete: () => void
}) {
  const meta = activityMeta[activity.type]
  const Icon = meta.icon
  const modes: Activity['timeMode'][] = ['全天', '上午', '下午', '晚上', '具体时间']

  return (
    <section className="relative mb-8 rounded border border-gray-200 bg-white">
      <div className={`absolute -left-[47px] top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white shadow-sm ${meta.soft}`}>
        <Icon className={`h-4 w-4 ${meta.color}`} />
      </div>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${meta.color}`} />
          <span className="font-medium text-gray-900">{activity.type}</span>
        </div>
        <button onClick={onDelete} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600">
          <Trash2 className="h-3.5 w-3.5" />
          删除
        </button>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-[88px_1fr] items-center gap-3">
          <label className="text-right text-sm text-gray-600">
            节点名称 <span className="text-red-500">*</span>
          </label>
          <input value={activity.title} onChange={(event) => onChange({ title: event.target.value })} className={inputClass} />
        </div>
        <div className="grid grid-cols-[88px_1fr] items-center gap-3">
          <label className="text-right text-sm text-gray-600">
            时间 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-4">
            {modes.map((mode) => (
              <label key={mode} className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700">
                <input type="radio" checked={activity.timeMode === mode} onChange={() => onChange({ timeMode: mode })} className="accent-blue-600" />
                {mode}
              </label>
            ))}
            {activity.timeMode === '具体时间' && (
              <div className="relative">
                <input type="time" value={activity.time || ''} onChange={(event) => onChange({ time: event.target.value })} className={`${inputClass} w-36 pr-8`} />
                <Clock3 className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
        </div>
        {activity.type === '餐饮' && (
          <>
            <div className="grid grid-cols-[88px_1fr] items-center gap-3">
              <label className="text-right text-sm text-gray-600">餐饮类型</label>
              <div className="flex gap-5">
                {(['早餐', '午餐', '晚餐', '全天餐饮'] as const).map((type) => (
                  <label key={type} className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input type="radio" checked={activity.mealType === type} onChange={() => onChange({ mealType: type })} className="accent-blue-600" />
                    {type}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-[88px_1fr] items-center gap-3">
              <label className="text-right text-sm text-gray-600">餐饮收费</label>
              <div className="flex gap-5">
                <label className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input type="radio" checked={activity.feeIncluded === true} onChange={() => onChange({ feeIncluded: true })} className="accent-blue-600" />
                  费用包含
                </label>
                <label className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input type="radio" checked={activity.feeIncluded === false} onChange={() => onChange({ feeIncluded: false })} className="accent-blue-600" />
                  费用自理
                </label>
              </div>
            </div>
          </>
        )}
        <div className="grid grid-cols-[88px_1fr] items-center gap-3">
          <label className="text-right text-sm text-gray-600">地点</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={activity.address || ''}
              onChange={(event) => onChange({ address: event.target.value })}
              placeholder="请输入地点"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
        <div className="grid grid-cols-[88px_1fr] items-start gap-3">
          <label className="pt-2 text-right text-sm text-gray-600">补充说明</label>
          <textarea
            value={activity.note || ''}
            onChange={(event) => onChange({ note: event.target.value.slice(0, 200) })}
            rows={2}
            placeholder="请输入补充说明"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>
    </section>
  )
}

function Preview({ plan }: { plan: DayPlan }) {
  return (
    <div className="mx-auto max-w-4xl py-4">
      <div className="border-b border-gray-200 pb-5">
        <div className="mb-2 text-sm font-semibold text-blue-600">DAY {plan.day}</div>
        <h3 className="text-xl font-semibold leading-8 text-gray-900">{plan.title}</h3>
        {plan.highlight && <p className="mt-2 text-sm text-orange-600">行程亮点：{plan.highlight}</p>}
      </div>
      <div className="mt-6 space-y-5">
        {plan.activities.length === 0 && <div className="py-20 text-center text-sm text-gray-400">当日暂无行程安排</div>}
        {plan.activities.map((activity) => {
          const meta = activityMeta[activity.type]
          const Icon = meta.icon
          return (
            <div key={activity.id} className="flex gap-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.soft}`}>
                <Icon className={`h-4 w-4 ${meta.color}`} />
              </div>
              <div className="min-w-0 flex-1 border-b border-gray-100 pb-5">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                  <span className="shrink-0 text-sm text-gray-500">{activity.timeMode === '具体时间' ? activity.time : activity.timeMode}</span>
                </div>
                {activity.address && <p className="mt-2 text-sm text-gray-600">{activity.address}</p>}
                {activity.note && <p className="mt-2 text-sm leading-6 text-gray-500">{activity.note}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
