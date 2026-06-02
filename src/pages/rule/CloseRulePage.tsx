import RuleCrudPage, { createRuleRecord } from './RuleCrudPage'

const defaultForm = {
  code: 'CAN-NEW',
  name: '',
  approvalStatus: 'pending' as const,
  applyScope: '散客订单',
  channel: '全部渠道',
  triggerPoint: '客户主动取消',
  amountType: 'percent' as const,
  amountValue: 10,
  dueDays: 30,
  priority: 10,
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  allowManualAdjust: true,
  remark: '',
}

export default function CloseRulePage() {
  return (
    <RuleCrudPage
      config={{
        title: '订单取消规则管理',
        description: '维护不同取消时点、渠道和订单类型下的取消费用与审批口径',
        addText: '新增取消规则',
        amountLabel: '取消费用',
        amountValueLabel: '扣费数值',
        dueDaysLabel: '开航前区间',
        dueDaysSuffix: '天',
        triggerLabel: '取消场景',
        adjustLabel: '人工豁免',
        defaultForm,
        scopeOptions: ['散客订单', '团队订单', '包船订单', '电商订单', '入境订单'],
        channelOptions: ['全部渠道', '直营', '经销商', 'OTA', '企业客户'],
        triggerOptions: ['客户主动取消', '资源不足取消', '天气原因取消', '签证原因取消', '平台订单取消'],
        amountTypeOptions: [
          { value: 'percent', label: '按订单比例' },
          { value: 'fixed', label: '固定金额' },
          { value: 'perPerson', label: '按人扣费' },
          { value: 'perRoom', label: '按房扣费' },
        ],
        initialData: [
          createRuleRecord({ ...defaultForm, code: 'CAN-001', name: '开航前30天取消', amountType: 'percent', amountValue: 10, dueDays: 30, remark: '开航前30天及以上取消，扣除订单金额10%。' }),
          createRuleRecord({ ...defaultForm, code: 'CAN-002', name: '开航前15天取消', amountType: 'percent', amountValue: 30, dueDays: 15, priority: 15, remark: '开航前15天取消，扣除订单金额30%。' }),
          createRuleRecord({ ...defaultForm, code: 'CAN-003', name: '包船临期取消', applyScope: '包船订单', channel: '企业客户', amountType: 'percent', amountValue: 70, dueDays: 20, priority: 25, allowManualAdjust: false, remark: '包船订单临期取消按合同约定扣除70%。' }),
        ],
      }}
    />
  )
}
