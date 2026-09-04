export interface DealerRuleGroup {
  id: string
  name: string
  code: string
  description: string
  dealerCount: number
}

export const DEALER_RULE_GROUPS: DealerRuleGroup[] = [
  {
    id: 'group_a',
    name: 'A组（核心分销商）',
    code: 'GRP-A',
    description: '战略合作分销商，资质评级AAA，享专属政策与高授信额度',
    dealerCount: 6,
  },
  {
    id: 'group_b',
    name: 'B组（战略合作商）',
    code: 'GRP-B',
    description: '大中型区域组团社与主力分销渠道，资质评级AA',
    dealerCount: 8,
  },
  {
    id: 'group_c',
    name: 'C组（普通分销商）',
    code: 'GRP-C',
    description: '标准签约旅行社及常规渠道商，执行标准合作政策',
    dealerCount: 15,
  },
  {
    id: 'group_d',
    name: 'D组（观察分销商）',
    code: 'GRP-D',
    description: '新入驻或近期交易活跃度较低的分销商，执行严格结算风控',
    dealerCount: 5,
  },
  {
    id: 'group_ota',
    name: 'OTA专享渠道组',
    code: 'GRP-OTA',
    description: '携程、美团、飞猪等线上直连平台，执行接口实时规则',
    dealerCount: 4,
  },
]

export function getDealerGroupNames(groupIds: string[]): string[] {
  return groupIds
    .map((id) => DEALER_RULE_GROUPS.find((g) => g.id === id)?.name || id)
    .filter(Boolean)
}

export function formatDealerGroupSummary(groupIds: string[]): string {
  if (!groupIds || groupIds.length === 0) return '未配置'
  const names = getDealerGroupNames(groupIds)
  if (names.length <= 2) return names.join('、')
  return `${names.slice(0, 2).join('、')} 等${names.length}个分组`
}
