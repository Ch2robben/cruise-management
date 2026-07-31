export type PolicyContentCategory = 'booking_rule' | 'change_refund_rule' | 'new_route' | 'new_product' | 'distribution_policy'
export type PolicyContentStatus = 'draft' | 'published' | 'disabled'

export interface PolicyContent {
  id: string
  title: string
  category: PolicyContentCategory
  summary: string
  content: string
  status: PolicyContentStatus
  sort: number
  updatedBy: string
  updatedAt: string
  publishedAt: string
  pinned?: boolean
}

export type PolicyContentForm = Pick<
  PolicyContent,
  'title' | 'category' | 'summary' | 'content' | 'status' | 'sort' | 'pinned'
>

export const categoryOptions: Array<{ value: PolicyContentCategory; label: string }> = [
  { value: 'booking_rule', label: '预订规则' },
  { value: 'change_refund_rule', label: '退改规则' },
  { value: 'new_route', label: '新航线发布' },
  { value: 'new_product', label: '新产品介绍' },
  { value: 'distribution_policy', label: '分销政策说明' },
]

export const categoryClass: Record<PolicyContentCategory, string> = {
  booking_rule: 'bg-blue-50 text-blue-700 border-blue-200',
  change_refund_rule: 'bg-orange-50 text-orange-700 border-orange-200',
  new_route: 'bg-teal-50 text-teal-700 border-teal-200',
  new_product: 'bg-purple-50 text-purple-700 border-purple-200',
  distribution_policy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const initialContents: PolicyContent[] = [
  {
    id: 'policy-content-001',
    title: '长江游轮产品预订与出票须知',
    category: 'booking_rule',
    summary: '说明预订信息填写、舱房选择、定金支付及订单保留要求。',
    content: `
      <p><b>预订前请确认航次、房型及入住人数。</b></p>
      <ol>
        <li><b>实名制登记：</b>所有旅客姓名和有效证件号码须与出行所持证件完全一致，一旦出票修改可能产生退改手续费。</li>
        <li><b>定金与尾款：</b>提交订单后，请在 30 分钟内完成定金支付；尾款须于开航前 15 天付清。</li>
        <li><b>儿童与加床：</b>儿童、婴儿及加床需求以对应票类和房型规格为准。如需申请婴儿床，请提前在订单备注中说明。</li>
        <li><b>特殊旅客提示：</b>孕妇、70 周岁（含）以上老人出行须有成年家属陪同并签署健康声明。</li>
      </ol>
    `,
    status: 'published',
    sort: 10,
    pinned: true,
    updatedBy: '系统管理员',
    updatedAt: '2026-07-26T09:30:00',
    publishedAt: '2026-07-20T10:00:00',
  },
  {
    id: 'policy-content-002',
    title: '分销渠道订单退改及不可抗力退票规程',
    category: 'change_refund_rule',
    summary: '展示订单退改申请入口、费用计算口径、航运不可抗力退费标准。',
    content: `
      <p><b>订单退改费用以提交申请时匹配到的有效规则为准。</b></p>
      <ul>
        <li><b>常规退票损失费：</b>
          <ul>
            <li>开航前 30 天及以上：免费退票；</li>
            <li>开航前 15-29 天：收取票面金额 10% 损失费；</li>
            <li>开航前 7-14 天：收取票面金额 30% 损失费；</li>
            <li>开航前 3-6 天：收取票面金额 50% 损失费；</li>
            <li>开航前 3 天以内及开航后：收取 100% 损失费。</li>
          </ul>
        </li>
        <li><b>航运不可抗力（水位/天气/管制）：</b>如因长江枯水、洪水、大雾或水闸管制导致航线变更或取消，系统将全额无损退款或免费改期。</li>
        <li><b>变更人员或房型：</b>涉及旅客姓名变更，须在开航前 3 天申请，免收换名手续费（每房限 1 人）。</li>
      </ul>
    `,
    status: 'published',
    sort: 20,
    pinned: true,
    updatedBy: '彭琳',
    updatedAt: '2026-07-25T16:20:00',
    publishedAt: '2026-07-22T11:15:00',
  },
  {
    id: 'policy-content-003',
    title: '长江叁号“重庆—宜昌”4天3晚精品航线上架公告',
    category: 'new_route',
    summary: '介绍重庆至宜昌航线的主要停靠港和产品特色。',
    content: `
      <p><b>长江叁号游轮“重庆—宜昌”精品下水航线现已在分销平台全面开放预订！</b></p>
      <p>航线涵盖丰都鬼城、白帝城、瞿塘峡、巫峡、神女溪、三峡大坝等核心景区，全船含双人标准套房与阳台观景房。</p>
      <ul>
        <li><b>行程天数：</b> 4 天 3 晚（重庆朝天门登船，宜昌茅坪港下船）</li>
        <li><b>包含服务：</b> 全程豪华自助餐、船员晚会、景区首道门票及导游服务。</li>
        <li><b>分销优惠：</b> 签约分销商预订本航线享专属结算折扣及组团激励。</li>
      </ul>
    `,
    status: 'published',
    sort: 30,
    pinned: false,
    updatedBy: '赵昕玥',
    updatedAt: '2026-07-26T14:10:00',
    publishedAt: '2026-07-26T14:10:00',
  },
  {
    id: 'policy-content-004',
    title: '长江探索号全新行政套房产品及尊享礼遇介绍',
    category: 'new_product',
    summary: '展示长江探索号套房产品定位、入住组合及预订提示。',
    content: `
      <p><b>长航长江探索号全新升级行政套房，提供 VIP 专属礼遇。</b></p>
      <ul>
        <li><b>尊享礼遇：</b> 包含 24 小时私人管家服务、VIP 登船绿色通道、免费房内早餐及专属行政酒廊待遇。</li>
        <li><b>房型配置：</b> 独立私家观景阳台、全套高端洗漱用品、免费客房送餐服务。</li>
        <li><b>预订提示：</b> 极简 1:1 船客比服务，每航次限量 38 间套房，支持单人包舱和双人入住。</li>
      </ul>
    `,
    status: 'published',
    sort: 40,
    pinned: false,
    updatedBy: '彭琳',
    updatedAt: '2026-07-24T11:45:00',
    publishedAt: '2026-07-24T11:45:00',
  },
  {
    id: 'policy-content-005',
    title: '2026年暑期经销商组团阶梯返利及授信管理政策说明',
    category: 'distribution_policy',
    summary: '说明经销商暑期组团返利计算标准、预存扣款及授信额度调高细则。',
    content: `
      <p>为鼓励分销合作伙伴创收，特制定 2026 暑期分销奖励政策：</p>
      <ol>
        <li><b>组团阶梯返利：</b> 单月出票达 50 人以上返利 3%；达 100 人以上返利 5%；达 200 人以上返利 8%。</li>
        <li><b>授信额度：</b> 信用星级 B 级以上经销商可申请最高 30 万元授信循环额度。</li>
        <li><b>结算时效：</b> 返利于次月 10 日前由系统自动核算并生成结算单。</li>
      </ol>
    `,
    status: 'published',
    sort: 50,
    pinned: false,
    updatedBy: '系统管理员',
    updatedAt: '2026-07-27T10:00:00',
    publishedAt: '2026-07-27T10:00:00',
  },
  {
    id: 'policy-content-006',
    title: '特殊旅客预订与安全协议填写规范',
    category: 'booking_rule',
    summary: '说明儿童、婴儿及其他特殊旅客的预订信息填写要求。',
    content: `
      <p>特殊旅客下单时须选择正确票类，并按页面要求填写出生日期、证件信息和监护人信息。</p>
    `,
    status: 'disabled',
    sort: 60,
    pinned: false,
    updatedBy: '系统管理员',
    updatedAt: '2026-07-18T09:00:00',
    publishedAt: '2026-07-10T09:00:00',
  },
]

let storeContents: PolicyContent[] = [...initialContents]

export function getPolicyContents(): PolicyContent[] {
  return storeContents
}

export function getPublishedPolicyContents(): PolicyContent[] {
  return storeContents.filter((item) => item.status === 'published')
}

export function addPolicyContent(form: PolicyContentForm, operator = '当前用户'): PolicyContent {
  const now = new Date().toISOString()
  const newItem: PolicyContent = {
    id: 'policy-content-' + Date.now().toString(36),
    title: form.title.trim(),
    category: form.category,
    summary: form.summary.trim(),
    content: form.content,
    status: form.status,
    sort: form.sort,
    pinned: form.pinned ?? false,
    updatedBy: operator,
    updatedAt: now,
    publishedAt: form.status === 'published' ? now : '',
  }
  storeContents = [newItem, ...storeContents]
  return newItem
}

export function updatePolicyContent(id: string, form: PolicyContentForm, operator = '当前用户'): PolicyContent | null {
  const now = new Date().toISOString()
  let updatedItem: PolicyContent | null = null

  storeContents = storeContents.map((item) => {
    if (item.id === id) {
      updatedItem = {
        ...item,
        title: form.title.trim(),
        category: form.category,
        summary: form.summary.trim(),
        content: form.content,
        status: form.status,
        sort: form.sort,
        pinned: form.pinned ?? item.pinned ?? false,
        updatedBy: operator,
        updatedAt: now,
        publishedAt: form.status === 'published' ? item.publishedAt || now : item.publishedAt,
      }
      return updatedItem
    }
    return item
  })

  return updatedItem
}

export function togglePolicyPublishStatus(id: string, operator = '当前用户'): PolicyContent | null {
  const now = new Date().toISOString()
  let updatedItem: PolicyContent | null = null

  storeContents = storeContents.map((item) => {
    if (item.id === id) {
      const nextStatus: PolicyContentStatus = item.status === 'published' ? 'disabled' : 'published'
      updatedItem = {
        ...item,
        status: nextStatus,
        updatedBy: operator,
        updatedAt: now,
        publishedAt: nextStatus === 'published' ? item.publishedAt || now : item.publishedAt,
      }
      return updatedItem
    }
    return item
  })

  return updatedItem
}

export function deletePolicyContent(id: string): boolean {
  const lenBefore = storeContents.length
  storeContents = storeContents.filter((item) => item.id !== id)
  return storeContents.length < lenBefore
}

export function getCategoryLabel(category: PolicyContentCategory): string {
  return categoryOptions.find((item) => item.value === category)?.label || category
}

export function getPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
