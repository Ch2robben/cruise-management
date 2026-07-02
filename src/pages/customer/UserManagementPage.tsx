import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'

type UserTabKey =
  | 'account'
  | 'reach'
  | 'segment'
  | 'profile'
  | 'marketing'
  | 'behavior'
  | 'funnel'

interface UserTab {
  key: UserTabKey
  label: string
  title: string
  summary: string
  bullets: string[]
}

const tabs: UserTab[] = [
  {
    key: 'account',
    label: '统一账号',
    title: '统一的用户身份识别与账号体系',
    summary: '建立跨小程序、官网、OTA、自营渠道的统一用户中心，实现多端账号绑定与唯一身份识别。',
    bullets: [
      '支持手机号、微信、支付宝等多渠道账号绑定',
      '跨终端唯一用户标识，打通各触点用户数据',
      '账号合并、解绑与主账号识别规则',
    ],
  },
  {
    key: 'reach',
    label: '多渠道触达',
    title: '多渠道属性触达能力',
    summary: '集中式消息中心，支持行为触发与运营手动触达，覆盖主流通知渠道。',
    bullets: [
      '小程序推送、微信服务消息、短信（国内/国际）、邮件',
      '订单、行程变更、活动通知等行为自动触发',
      '支持批量推送、定向推送与消息模板管理',
    ],
  },
  {
    key: 'segment',
    label: '标签分群',
    title: '用户标签及分群管理',
    summary: '为运营人员提供标签创建、规则打标与动态分群能力，支撑精准营销。',
    bullets: [
      '自定义标签：亲子、高价值、首访等',
      '按年龄、性别、地域、消费、偏好、频次、积分等维度筛选',
      '规则自动打标 + 人工打标，分群动态更新',
    ],
  },
  {
    key: 'profile',
    label: '用户画像',
    title: '用户画像标签',
    summary: '360° 用户画像视图，聚合基础属性、消费特征与活跃行为。',
    bullets: [
      '基础属性：年龄、性别、地域等',
      '消费特征：客单价、频次、偏好产品、累计价值',
      '活跃行为：活跃时段、活跃度、终端类型、渠道来源',
      '支持画像标签可视化展示',
    ],
  },
  {
    key: 'marketing',
    label: '营销看板',
    title: '营销活动及全链路数据看板',
    summary: '追踪营销活动效果，对比不同活动表现，辅助运营决策。',
    bullets: [
      '优惠券核销、参与人数、转化率、ROI 等核心指标',
      '活动效果对比与趋势分析',
      '全链路营销数据汇总看板',
    ],
  },
  {
    key: 'behavior',
    label: '行为采集',
    title: '全渠道用户行为数据采集',
    summary: '采集小程序、官网、H5 等渠道的用户行为事件，沉淀分析数据。',
    bullets: [
      '点击、搜索、登录等行为事件',
      '下单、支付、退款等交易行为',
      '浏览行程、房型、价格等内容行为',
    ],
  },
  {
    key: 'funnel',
    label: '转化漏斗',
    title: '转化路径分析与漏斗分析',
    summary: '分析用户从进入到下单的转化路径，识别流失节点与渠道差异。',
    bullets: [
      '全链路转化漏斗：访问 → 浏览 → 下单 → 支付',
      '各步骤流失率与瓶颈识别',
      '小程序 / OTA / 官网等渠道转化对比',
    ],
  },
]

const tabKeySet = new Set<UserTabKey>(tabs.map((tab) => tab.key))

function isUserTabKey(value: string | null): value is UserTabKey {
  return Boolean(value && tabKeySet.has(value as UserTabKey))
}

function TabPlaceholder({ tab }: { tab: UserTab }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{tab.title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{tab.summary}</p>
      <ul className="mt-4 space-y-2">
        {tab.bullets.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
        功能开发中，后续在此 Tab 内实现具体能力
      </div>
    </section>
  )
}

export default function UserManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const initialTab = isUserTabKey(tabFromUrl) ? tabFromUrl : 'account'
  const [activeTab, setActiveTab] = useState<UserTabKey>(initialTab)

  const activeTabMeta = useMemo(
    () => tabs.find((tab) => tab.key === activeTab) || tabs[0],
    [activeTab],
  )

  const switchTab = (key: UserTabKey) => {
    setActiveTab(key)
    setSearchParams({ tab: key }, { replace: true })
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="border-b border-gray-200 bg-white px-6 pt-6">
        <PageHeader
          title="用户管理"
          description="产品中心数字化用户能力：统一账号、触达、标签分群、画像、营销、行为与转化分析"
        />
        <nav className="-mb-px mt-4 flex gap-6 overflow-x-auto text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              aria-selected={activeTab === tab.key}
              className={`shrink-0 border-b-2 px-1 pb-3 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 font-medium text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        <TabPlaceholder tab={activeTabMeta} />
      </div>
    </div>
  )
}
