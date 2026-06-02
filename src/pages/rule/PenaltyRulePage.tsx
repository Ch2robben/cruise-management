import RuleCrudPage, { createRuleRecord } from './RuleCrudPage'

const defaultForm = {
  code: 'PEN-NEW',
  name: '',
  approvalStatus: 'pending' as const,
  applyScope: '经销商订单',
  channel: '全部分销商',
  triggerPoint: '船款逾期',
  amountType: 'percent' as const,
  amountValue: 5,
  dueDays: 1,
  priority: 10,
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  allowManualAdjust: false,
  remark: '',
}

export default function PenaltyRulePage() {
  return (
    <RuleCrudPage
      config={{
        title: '罚金规则管理',
        description: '维护可按全部或个别分销商生效的罚金计算规则',
        addText: '新增罚金规则',
        amountLabel: '罚金标准',
        amountValueLabel: '罚金数值',
        dueDaysLabel: '宽限期',
        dueDaysSuffix: '天',
        triggerLabel: '触发场景',
        scopeLabel: '订单范围',
        channelLabel: '适用分销商',
        adjustLabel: '人工减免',
        defaultForm,
        scopeOptions: ['经销商订单', '团队订单', '包船订单'],
        channelOptions: ['全部分销商', '重庆渝之旅', '上海邮轮中心', '湖北峡江国旅', '成都山水国旅'],
        triggerOptions: ['船款逾期'],
        amountTypeOptions: [
          { value: 'percent', label: '按订单比例' },
          { value: 'fixed', label: '固定金额' },
          { value: 'perPerson', label: '按人收取' },
          { value: 'formula', label: '公式系数' },
        ],
        initialData: [
          createRuleRecord({ ...defaultForm, code: 'PEN-001', name: '全体分销商船款逾期罚金', channel: '全部分销商', triggerPoint: '船款逾期', amountType: 'percent', amountValue: 5, dueDays: 1, remark: '全部分销商超过船款截止日后按未付金额5%计罚。' }),
          createRuleRecord({ ...defaultForm, code: 'PEN-002', name: '重庆渝之旅船款逾期罚金', channel: '重庆渝之旅', triggerPoint: '船款逾期', amountType: 'percent', amountValue: 8, dueDays: 2, priority: 15, remark: '重庆渝之旅船款逾期后按未付金额8%计罚。' }),
          createRuleRecord({ ...defaultForm, code: 'PEN-003', name: '上海邮轮中心船款逾期罚金', channel: '上海邮轮中心', triggerPoint: '船款逾期', amountType: 'percent', amountValue: 10, dueDays: 0, priority: 20, allowManualAdjust: true, remark: '上海邮轮中心船款逾期后按未付金额10%计罚。' }),
        ],
      }}
    />
  )
}
