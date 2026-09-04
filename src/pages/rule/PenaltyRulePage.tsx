import RuleCrudPage, { createRuleRecord } from './RuleCrudPage'
import { createDefaultApplicableScope } from '@/components/rule/ApplicableScopeTransfer'

const defaultForm = {
  code: 'PEN-NEW',
  name: '',
  approvalStatus: 'pending' as const,
  applyScope: createDefaultApplicableScope(),
  dealerGroupIds: ['group_a', 'group_b'],
  channel: '全部分销商',
  triggerPoint: '船款逾期',
  amountType: 'percent' as const,
  amountValue: 5,
  dueDays: 1,
  priority: 10,
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  longTerm: false,
  allowManualAdjust: false,
  remark: '',
}

export default function PenaltyRulePage() {
  return (
    <RuleCrudPage
      config={{
        title: '罚金规则管理',
        description: '维护按分销商分组生效的逾期罚金计算规则（不关联具体产品）',
        addText: '新增罚金规则',
        scopeMode: 'dealerGroup',
        amountLabel: '罚金标准',
        amountValueLabel: '罚金数值',
        dueDaysLabel: '宽限期',
        dueDaysSuffix: '天',
        triggerLabel: '触发场景',
        scopeLabel: '适用分销商分组',
        channelLabel: '适用渠道',
        adjustLabel: '人工减免',
        defaultForm,
        scopeOptions: ['A组（核心分销商）', 'B组（战略合作商）', 'C组（普通分销商）', 'D组（观察分销商）', 'OTA专享渠道组'],
        channelOptions: ['全部分销商', '直签组团社', 'OTA平台代理', '企业采购客户'],
        triggerOptions: ['船款逾期'],
        amountTypeOptions: [
          { value: 'percent', label: '按订单比例' },
          { value: 'fixed', label: '固定金额' },
          { value: 'perPerson', label: '按销售维度收取' },
        ],
        initialData: [
          createRuleRecord({
            ...defaultForm,
            code: 'PEN-001',
            name: 'A组/B组分销商船款逾期标准罚金',
            dealerGroupIds: ['group_a', 'group_b'],
            channel: '全部分销商',
            triggerPoint: '船款逾期',
            amountType: 'percent',
            amountValue: 5,
            dueDays: 1,
            remark: 'A组与B组分销商超过船款截止日后按未付金额5%计罚。',
          }),
          createRuleRecord({
            ...defaultForm,
            code: 'PEN-002',
            name: 'C组普通分销商船款逾期罚金',
            dealerGroupIds: ['group_c'],
            channel: '全部分销商',
            triggerPoint: '船款逾期',
            amountType: 'percent',
            amountValue: 8,
            dueDays: 2,
            priority: 15,
            remark: 'C组普通分销商船款逾期后按未付金额8%计罚。',
          }),
          createRuleRecord({
            ...defaultForm,
            code: 'PEN-003',
            name: 'D组与OTA高风险逾期严控罚金',
            dealerGroupIds: ['group_d', 'group_ota'],
            channel: '全部分销商',
            triggerPoint: '船款逾期',
            amountType: 'percent',
            amountValue: 10,
            dueDays: 0,
            priority: 20,
            allowManualAdjust: true,
            remark: 'D组与OTA专享渠道商船款逾期后按未付金额10%计罚，无宽限期。',
          }),
        ],
      }}
    />
  )
}
