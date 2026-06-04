import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle2, FileText, Link2, Plus, UserPlus, Users, XCircle } from 'lucide-react'
import { dealerApi, dealerChangeLogApi, dealerCooperationRuleApi } from '@/mock/api'
import { products } from '@/mock/data'
import type {
  Dealer,
  DealerChangeLog,
  DealerChangeStatus,
  DealerChangeType,
  DealerChannelType,
  DealerCooperationRule,
  DealerForm,
  DealerGroup,
  DealerLevel,
  DealerPriceSystem,
  DealerPurchasePermission,
  DealerRebateCycle,
  DealerRebateDimension,
  DealerRefundPermission,
  DealerSettlementCycle,
  DealerSettlementMethod,
  DealerSubjectType,
  PaginatedResult,
  SearchParams,
} from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { MultiCheckField, SelectField, type SelectOption } from '@/components/common/SelectField'

type TabKey = 'dealers' | 'approval' | 'rule' | 'logs'
type BindingStatus = 'bound' | 'unbound'
type ApplicationStatus = 'pending' | 'approved' | 'rejected'
type CreateMode = 'existing' | 'new'

interface ExchangeBindingRecord {
  id: string
  agencyCode: string
  agencyName: string
  exchangeAccount: string
  contact: string
  phone: string
  validStatus: 'valid' | 'invalid'
  bindingStatus: BindingStatus
  dealerId?: string
  dealerName?: string
  boundBy?: string
  boundAt?: string
  latestSyncAt: string
}

interface CooperationApplication {
  id: string
  dealerName: string
  account: string
  applicant: string
  phone: string
  email: string
  subjectType: DealerSubjectType
  companyName: string
  socialCreditCode: string
  businessLicenseNo: string
  travelAgencyPermitNo: string
  attachments: string[]
  appliedAt: string
  auditedBy?: string
  auditedAt?: string
  status: ApplicationStatus
  remark?: string
}

const channelTypeLabels: Record<DealerChannelType, string> = { ota: 'OTA', distribution: '同业分销', group: '组团社' }
const subjectTypeLabels: Record<DealerSubjectType, string> = { travel_agency: '旅行社', hotel: '酒店', homestay: '民宿', other: '其他' }
const levelLabels: Record<DealerLevel, string> = { strategic: '战略', core: '核心', normal: '普通' }
const settlementLabels: Record<DealerSettlementCycle, string> = { monthly: '月度', quarterly: '季度', voyage_end: '航次结束' }
const settlementMethodLabels: Record<DealerSettlementMethod, string> = { unlimited: '不限', credit_only: '仅授信支付', prepaid_only: '仅预存款支付' }
const priceSystemLabels: Record<DealerPriceSystem, string> = { retail: '零售公布价', online: '线上销售价', contract: '签约结算价', regional: '区域结算价' }
const refundLabels: Record<DealerRefundPermission, string> = { none: '无', self: '限自身订单', with_subordinate: '含下级' }
const rebateDimensionLabels: Record<DealerRebateDimension, string> = { sales: '按销售额阶梯', orders: '按订单量', product: '按特定产品' }
const rebateCycleLabels: Record<DealerRebateCycle, string> = { monthly: '月度', quarterly: '季度', yearly: '年度' }
const purchasePermissionLabels: Record<DealerPurchasePermission, string> = { enabled: '启用', disabled: '禁用' }
const changeTypeLabels: Record<DealerChangeType, string> = {
  add: '添加分销商',
  move_group: '移动分组',
  settlement_change: '变更结算方式',
  enable: '启用',
  disable: '禁用',
}
const changeStatusLabels: Record<DealerChangeStatus, string> = { success: '成功', failed: '失败' }
const bindingStatusLabels: Record<BindingStatus, string> = { bound: '已绑定', unbound: '未绑定' }
const applicationStatusLabels: Record<ApplicationStatus, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回' }

const initialExchangeBindings: ExchangeBindingRecord[] = [
  {
    id: 'bind01',
    agencyCode: 'HX-2398432',
    agencyName: '航交所信息',
    exchangeAccount: '2001009',
    contact: '林某某',
    phone: '18312341234',
    validStatus: 'valid',
    bindingStatus: 'bound',
    dealerId: 'dealer01',
    dealerName: '重庆海外旅业集团',
    boundBy: '李某某',
    boundAt: '2026-05-26 09:31:12',
    latestSyncAt: '2026-06-03 08:10:00',
  },
  {
    id: 'bind02',
    agencyCode: 'HX-2398433',
    agencyName: '航交所信息',
    exchangeAccount: '2001010',
    contact: '王某某',
    phone: '18600008888',
    validStatus: 'valid',
    bindingStatus: 'unbound',
    latestSyncAt: '2026-06-02 16:20:00',
  },
  {
    id: 'bind03',
    agencyCode: 'HX-2398434',
    agencyName: '航交所信息',
    exchangeAccount: '2001011',
    contact: '周某某',
    phone: '13900006666',
    validStatus: 'invalid',
    bindingStatus: 'unbound',
    latestSyncAt: '2026-06-01 11:45:00',
  },
]

const initialApplications: CooperationApplication[] = [
  {
    id: 'app01',
    dealerName: '三峡优选旅行社',
    account: 'SQ20260601001',
    applicant: '赵某某',
    phone: '18100001234',
    email: 'apply01@example.com',
    subjectType: 'travel_agency',
    companyName: '三峡优选旅行社有限公司',
    socialCreditCode: '91500103MA5U0A001A',
    businessLicenseNo: 'BL-2026-001',
    travelAgencyPermitNo: 'L-CQ-10086',
    attachments: ['营业执照.jpg', '旅行社业务经营许可证.jpg', '合作申请函.pdf'],
    appliedAt: '2026-06-01 09:12:00',
    status: 'pending',
  },
  {
    id: 'app02',
    dealerName: '江城文旅分销中心',
    account: 'SQ20260528002',
    applicant: '钱某某',
    phone: '18200005678',
    email: 'apply02@example.com',
    subjectType: 'travel_agency',
    companyName: '江城文旅分销中心',
    socialCreditCode: '91420103MA5U0B002B',
    businessLicenseNo: 'BL-2026-002',
    travelAgencyPermitNo: 'L-HB-20991',
    attachments: ['营业执照.jpg', '许可证.jpg'],
    appliedAt: '2026-05-28 15:30:00',
    auditedBy: '系统管理员',
    auditedAt: '2026-05-29 10:22:00',
    status: 'approved',
    remark: '资质完整，允许合作。',
  },
  {
    id: 'app03',
    dealerName: '山城民宿代理点',
    account: 'SQ20260526003',
    applicant: '孙某某',
    phone: '18300007890',
    email: 'apply03@example.com',
    subjectType: 'homestay',
    companyName: '山城民宿代理点',
    socialCreditCode: '92500103MA5U0C003C',
    businessLicenseNo: 'BL-2026-003',
    travelAgencyPermitNo: '',
    attachments: ['营业执照.jpg'],
    appliedAt: '2026-05-26 11:08:00',
    auditedBy: '系统管理员',
    auditedAt: '2026-05-26 16:45:00',
    status: 'rejected',
    remark: '主体类型与合作范围不匹配。',
  },
]

const emptyForm: DealerForm = {
  name: '',
  code: '',
  account: '',
  groupId: 'group_a',
  subjectType: 'travel_agency',
  socialCreditCode: '',
  channelTypes: ['distribution'],
  region: '重庆/渝中',
  level: 'normal',
  contact: '',
  phone: '',
  email: '',
  address: '',
  qualificationFiles: [],
  businessLicenseNo: '',
  travelAgencyPermitNo: '',
  creditLimit: 0,
  guaranteeAmount: 0,
  settlementCycle: 'voyage_end',
  settlementMethod: 'unlimited',
  priceSystems: ['contract'],
  otaServiceRate: null,
  refundPermission: 'self',
  rebateDimensions: [],
  rebateCycle: 'quarterly',
  authorizedProductIds: [],
}

const channelTypeOptions: SelectOption<DealerChannelType>[] = [
  { value: 'ota', label: 'OTA' },
  { value: 'distribution', label: '同业分销' },
  { value: 'group', label: '组团社' },
]

const subjectTypeOptions: SelectOption<DealerSubjectType>[] = [
  { value: 'travel_agency', label: '旅行社' },
  { value: 'hotel', label: '酒店' },
  { value: 'homestay', label: '民宿' },
  { value: 'other', label: '其他' },
]

const levelOptions: SelectOption<DealerLevel>[] = [
  { value: 'strategic', label: '战略' },
  { value: 'core', label: '核心' },
  { value: 'normal', label: '普通' },
]

const purchaseOptions: SelectOption<string>[] = [
  { value: 'all', label: '全部' },
  { value: 'enabled', label: '启用' },
  { value: 'disabled', label: '禁用' },
]

const priceSystemOptions: SelectOption<DealerPriceSystem>[] = [
  { value: 'retail', label: '零售公布价' },
  { value: 'online', label: '线上销售价' },
  { value: 'contract', label: '签约结算价' },
  { value: 'regional', label: '区域结算价' },
]

const settlementCycleOptions: SelectOption<DealerSettlementCycle>[] = [
  { value: 'monthly', label: '月度' },
  { value: 'quarterly', label: '季度' },
  { value: 'voyage_end', label: '航次结束' },
]

const settlementMethodOptions: SelectOption<DealerSettlementMethod>[] = [
  { value: 'unlimited', label: '不限' },
  { value: 'credit_only', label: '仅授信支付' },
  { value: 'prepaid_only', label: '仅预存款支付' },
]

const refundPermissionOptions: SelectOption<DealerRefundPermission>[] = [
  { value: 'none', label: '无' },
  { value: 'self', label: '限自身订单' },
  { value: 'with_subordinate', label: '含下级' },
]

const rebateDimensionOptions: SelectOption<DealerRebateDimension>[] = [
  { value: 'sales', label: '按销售额阶梯' },
  { value: 'orders', label: '按订单量' },
  { value: 'product', label: '按特定产品' },
]

const rebateCycleOptions: SelectOption<DealerRebateCycle>[] = [
  { value: 'monthly', label: '月度' },
  { value: 'quarterly', label: '季度' },
  { value: 'yearly', label: '年度' },
]

const logTypeOptions: SelectOption<string>[] = [
  { value: 'all', label: '全部' },
  { value: 'add', label: '添加分销商' },
  { value: 'move_group', label: '移动分组' },
  { value: 'settlement_change', label: '变更结算方式' },
  { value: 'enable', label: '启用' },
  { value: 'disable', label: '禁用' },
]

const logStatusOptions: SelectOption<string>[] = [
  { value: 'all', label: '全部' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
]

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export default function DealerPage() {
  const location = useLocation()
  const activeTab: TabKey = useMemo(() => {
    if (location.pathname.endsWith('/dealer-approvals')) return 'approval'
    if (location.pathname.endsWith('/dealer-rules') || location.pathname.endsWith('/dealer-cooperation')) return 'rule'
    if (location.pathname.endsWith('/dealer-change-logs')) return 'logs'
    return 'dealers'
  }, [location.pathname])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Dealer>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [groups, setGroups] = useState<DealerGroup[]>([])
  const [keyword, setKeyword] = useState('')
  const [groupFilter, setGroupFilter] = useState('group_all')
  const [purchaseFilter, setPurchaseFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DealerForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Dealer | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState<{ type: 'delete' | 'enable' | ''; id: string; message: string }>({ type: '', id: '', message: '' })

  const [disableOpen, setDisableOpen] = useState(false)
  const [disableTarget, setDisableTarget] = useState<Dealer | null>(null)
  const [disableType, setDisableType] = useState<'temporary' | 'permanent'>('temporary')
  const [disableDays, setDisableDays] = useState(30)
  const [disableReason, setDisableReason] = useState('')

  const [moveOpen, setMoveOpen] = useState(false)
  const [moveGroupId, setMoveGroupId] = useState('group_a')
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')

  const [rule, setRule] = useState<DealerCooperationRule | null>(null)
  const [ruleSaving, setRuleSaving] = useState(false)
  const [ruleKeyword, setRuleKeyword] = useState('')
  const [ruleStatusFilter, setRuleStatusFilter] = useState('all')
  const [ruleConfigOpen, setRuleConfigOpen] = useState(false)

  const [logsLoading, setLogsLoading] = useState(false)
  const [logs, setLogs] = useState<PaginatedResult<DealerChangeLog>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [logKeyword, setLogKeyword] = useState('')
  const [logType, setLogType] = useState('all')
  const [logStatus, setLogStatus] = useState('all')
  const [logDateFrom, setLogDateFrom] = useState('2026-05-01')
  const [logDateTo, setLogDateTo] = useState('2026-06-30')

  const [bindings, setBindings] = useState<ExchangeBindingRecord[]>(initialExchangeBindings)
  const [exchangeBindingOpen, setExchangeBindingOpen] = useState(false)
  const [bindingKeyword, setBindingKeyword] = useState('')
  const [bindingValidStatus, setBindingValidStatus] = useState('all')
  const [bindingStatus, setBindingStatus] = useState('all')
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false)
  const [bindingTarget, setBindingTarget] = useState<ExchangeBindingRecord | null>(null)
  const [bindingMode, setBindingMode] = useState<CreateMode>('existing')
  const [selectedDealerId, setSelectedDealerId] = useState('')
  const [newBindingDealerName, setNewBindingDealerName] = useState('')
  const [credentialOpen, setCredentialOpen] = useState(false)
  const [credentialInfo, setCredentialInfo] = useState<{ account: string; password: string } | null>(null)

  const [applications, setApplications] = useState<CooperationApplication[]>(initialApplications)
  const [applicationKeyword, setApplicationKeyword] = useState('')
  const [applicationStatus, setApplicationStatus] = useState('all')
  const [approvalDetailOpen, setApprovalDetailOpen] = useState(false)
  const [approvalTarget, setApprovalTarget] = useState<CooperationApplication | null>(null)
  const [approvalDecision, setApprovalDecision] = useState<'approved' | 'rejected'>('approved')
  const [approvalRemark, setApprovalRemark] = useState('')

  const regionOptions = useMemo(() => ['重庆/渝中', '重庆/江北', '湖北/宜昌', '湖北/武汉', '江苏/南京', '上海/浦东', '广东/广州', '福建/厦门'], [])
  const editableGroups = useMemo(() => groups.filter((item) => item.id !== 'group_all'), [groups])
  const groupOptions = useMemo<SelectOption<string>[]>(() => editableGroups.map((group) => ({ value: group.id, label: group.name })), [editableGroups])
  const allGroupOptions = useMemo<SelectOption<string>[]>(() => groups.map((group) => ({ value: group.id, label: group.id === 'group_all' ? `全部（${group.dealerCount}）` : `${group.name}（${group.dealerCount}）` })), [groups])
  const dealerOptions = useMemo<SelectOption<string>[]>(() => data.data.map((dealer) => ({ value: dealer.id, label: `${dealer.name}（${dealer.account || dealer.code}）` })), [data.data])

  const filteredBindings = useMemo(() => {
    const keywordValue = bindingKeyword.trim().toLowerCase()
    return bindings.filter((item) => {
      const keywordMatched = !keywordValue || item.agencyName.toLowerCase().includes(keywordValue) || item.agencyCode.toLowerCase().includes(keywordValue) || (item.dealerName || '').toLowerCase().includes(keywordValue)
      const validMatched = bindingValidStatus === 'all' || item.validStatus === bindingValidStatus
      const bindingMatched = bindingStatus === 'all' || item.bindingStatus === bindingStatus
      return keywordMatched && validMatched && bindingMatched
    })
  }, [bindingKeyword, bindingStatus, bindingValidStatus, bindings])

  const filteredApplications = useMemo(() => {
    const keywordValue = applicationKeyword.trim().toLowerCase()
    return applications.filter((item) => {
      const keywordMatched = !keywordValue || item.dealerName.toLowerCase().includes(keywordValue) || item.account.toLowerCase().includes(keywordValue) || item.applicant.toLowerCase().includes(keywordValue)
      const statusMatched = applicationStatus === 'all' || item.status === applicationStatus
      return keywordMatched && statusMatched
    })
  }, [applicationKeyword, applicationStatus, applications])

  const cooperationRuleRecords = useMemo(() => {
    if (!rule) return []
    const status = rule.allowSelfApply ? 'enabled' : 'disabled'
    const keywordValue = ruleKeyword.trim().toLowerCase()
    const records = [{
      id: rule.id,
      code: 'DCR-001',
      name: '默认分销商合作申请规则',
      applyScene: '分销商自助申请',
      merchantTypeText: rule.merchantTypes.map((item) => subjectTypeLabels[item]).join('、') || '未配置',
      attachmentText: rule.attachmentRequired ? '必填' : '非必填',
      allowSelfApply: rule.allowSelfApply,
      status,
      updatedBy: rule.updatedBy,
      updatedAt: rule.updatedAt,
    }]
    return records.filter((item) => {
      const keywordMatched = !keywordValue || [item.code, item.name, item.applyScene, item.merchantTypeText].some((value) => value.toLowerCase().includes(keywordValue))
      const statusMatched = ruleStatusFilter === 'all' || item.status === ruleStatusFilter
      return keywordMatched && statusMatched
    })
  }, [rule, ruleKeyword, ruleStatusFilter])

  const fetchGroups = useCallback(async () => {
    const result = await dealerApi.groups()
    setGroups(result)
  }, [])

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10, groupId: groupFilter }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (purchaseFilter !== 'all') params.purchasePermission = purchaseFilter
    if (subjectFilter !== 'all') params.subjectType = subjectFilter
    const result = await dealerApi.list(params)
    setData(result)
    setSelectedIds([])
    setLoading(false)
    fetchGroups()
  }, [fetchGroups, groupFilter, keyword, purchaseFilter, subjectFilter])

  const fetchLogs = useCallback(async (page = 1) => {
    setLogsLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (logKeyword.trim()) params.keyword = logKeyword.trim()
    if (logType !== 'all') params.operationType = logType
    if (logStatus !== 'all') params.operationStatus = logStatus
    if (logDateFrom) params.dateFrom = logDateFrom
    if (logDateTo) params.dateTo = logDateTo
    const result = await dealerChangeLogApi.list(params)
    setLogs(result)
    setLogsLoading(false)
  }, [logDateFrom, logDateTo, logKeyword, logStatus, logType])

  useEffect(() => {
    fetchData()
    dealerCooperationRuleApi.get().then(setRule)
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs()
  }, [activeTab, fetchLogs])

  const handleReset = () => {
    setKeyword('')
    setGroupFilter('group_all')
    setPurchaseFilter('all')
    setSubjectFilter('all')
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, groupId: editableGroups[0]?.id || 'group_a', authorizedProductIds: products.slice(0, 2).map((product) => product.id) })
    setFormOpen(true)
  }

  const openEdit = (record: Dealer) => {
    setEditingId(record.id)
    setForm({
      name: record.name,
      code: record.code,
      account: record.account,
      groupId: record.groupId,
      subjectType: record.subjectType,
      socialCreditCode: record.socialCreditCode,
      channelTypes: record.channelTypes,
      region: record.region,
      level: record.level,
      contact: record.contact,
      phone: record.phone,
      email: record.email,
      address: record.address,
      qualificationFiles: record.qualificationFiles,
      businessLicenseNo: record.businessLicenseNo,
      travelAgencyPermitNo: record.travelAgencyPermitNo,
      creditLimit: record.creditLimit,
      guaranteeAmount: record.guaranteeAmount,
      settlementCycle: record.settlementCycle,
      settlementMethod: record.settlementMethod,
      priceSystems: record.priceSystems,
      otaServiceRate: record.otaServiceRate,
      refundPermission: record.refundPermission,
      rebateDimensions: record.rebateDimensions,
      rebateCycle: record.rebateCycle,
      authorizedProductIds: record.authorizedProductIds,
    })
    setFormOpen(true)
  }

  const openDetail = async (record: Dealer) => {
    const result = await dealerApi.getById(record.id)
    setDetail(result || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.contact.trim() || !form.phone.trim()) return
    setFormLoading(true)
    const group = editableGroups.find((item) => item.id === form.groupId)
    const now = new Date().toISOString()
    if (editingId) {
      await dealerApi.update(editingId, { ...form, groupName: group?.name || '未分组', updatedBy: '当前用户', updatedAt: now })
    } else {
      await dealerApi.create({
        ...form,
        groupName: group?.name || '未分组',
        certificationStatus: 'verified',
        purchasePermission: 'enabled',
        disabledReason: '',
        disabledUntil: '',
        cooperationStartedAt: now.slice(0, 10),
        status: 'cooperating',
        updatedBy: '当前用户',
        updatedAt: now,
        createdAt: now,
      })
    }
    setFormLoading(false)
    setFormOpen(false)
    fetchData(data.page)
  }

  const askDelete = (record: Dealer) => {
    setConfirmConfig({ type: 'delete', id: record.id, message: `确定删除「${record.name}」吗？关联的订单与日志将保留。` })
    setConfirmOpen(true)
  }

  const askToggle = (record: Dealer) => {
    if (record.purchasePermission === 'enabled') {
      setDisableTarget(record)
      setDisableReason('')
      setDisableDays(30)
      setDisableType('temporary')
      setDisableOpen(true)
      return
    }
    setConfirmConfig({ type: 'enable', id: record.id, message: `确定启用「${record.name}」的购票资格吗？` })
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (confirmConfig.type === 'delete') await dealerApi.remove(confirmConfig.id)
    if (confirmConfig.type === 'enable') await dealerApi.toggleStatus(confirmConfig.id)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  const submitDisable = async () => {
    if (!disableTarget || !disableReason.trim()) return
    await dealerApi.toggleStatus(disableTarget.id)
    await dealerApi.update(disableTarget.id, {
      disabledReason: disableReason,
      disabledUntil: disableType === 'temporary' ? addDays(disableDays) : '',
      updatedAt: new Date().toISOString(),
      updatedBy: '当前用户',
    })
    setDisableOpen(false)
    fetchData(data.page)
  }

  const submitMoveGroup = async () => {
    if (selectedIds.length === 0) return
    await dealerApi.moveGroup(selectedIds, moveGroupId)
    setMoveOpen(false)
    fetchData(data.page)
  }

  const addLocalGroup = () => {
    if (!groupName.trim()) return
    const next: DealerGroup = { id: `local_${Date.now()}`, name: groupName.trim(), dealerCount: 0, sort: groups.length, remark: '原型新增分组。' }
    setGroups((current) => [...current, next])
    setMoveGroupId(next.id)
    setGroupName('')
    setGroupDialogOpen(false)
  }

  const saveRule = async () => {
    if (!rule) return
    setRuleSaving(true)
    const result = await dealerCooperationRuleApi.update(rule)
    setRule(result)
    setRuleSaving(false)
    setRuleConfigOpen(false)
  }

  const resetRuleFilters = () => {
    setRuleKeyword('')
    setRuleStatusFilter('all')
  }

  const openBindingDialog = (record: ExchangeBindingRecord) => {
    setBindingTarget(record)
    setBindingMode(record.bindingStatus === 'bound' ? 'existing' : 'existing')
    setSelectedDealerId(record.dealerId || data.data[0]?.id || '')
    setNewBindingDealerName(record.agencyName === '航交所信息' ? `${record.contact}渠道` : record.agencyName)
    setBindingDialogOpen(true)
  }

  const submitBinding = () => {
    if (!bindingTarget) return
    const now = new Date().toISOString()
    const selectedDealer = data.data.find((dealer) => dealer.id === selectedDealerId)
    const dealerName = bindingMode === 'existing' ? selectedDealer?.name : newBindingDealerName.trim()
    if (!dealerName) return
    const dealerId = bindingMode === 'existing' ? selectedDealerId : `dealer_new_${Date.now()}`
    setBindings((current) => current.map((item) => item.id === bindingTarget.id ? {
      ...item,
      bindingStatus: 'bound',
      dealerId,
      dealerName,
      boundBy: '当前用户',
      boundAt: now,
      latestSyncAt: now,
    } : item))
    if (bindingMode === 'new') {
      setCredentialInfo({ account: String(Math.floor(7000000 + Math.random() * 900000)), password: Math.random().toString(36).slice(2, 10) })
      setCredentialOpen(true)
    }
    setBindingDialogOpen(false)
  }

  const resetBindingFilters = () => {
    setBindingKeyword('')
    setBindingValidStatus('all')
    setBindingStatus('all')
  }

  const openApprovalDetail = (record: CooperationApplication) => {
    setApprovalTarget(record)
    setApprovalDecision(record.status === 'rejected' ? 'rejected' : 'approved')
    setApprovalRemark(record.remark || '')
    setApprovalDetailOpen(true)
  }

  const submitApproval = () => {
    if (!approvalTarget) return
    const now = new Date().toISOString()
    setApplications((current) => current.map((item) => item.id === approvalTarget.id ? {
      ...item,
      status: approvalDecision,
      auditedBy: '当前用户',
      auditedAt: now,
      remark: approvalRemark || (approvalDecision === 'approved' ? '资质审核通过。' : '资料不完整，请补充后重新提交。'),
    } : item))
    setApprovalDetailOpen(false)
  }

  const resetApplicationFilters = () => {
    setApplicationKeyword('')
    setApplicationStatus('all')
  }

  const toggleRow = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const togglePageRows = () => {
    const ids = data.data.map((item) => item.id)
    const allSelected = ids.every((id) => selectedIds.includes(id))
    setSelectedIds(allSelected ? [] : ids)
  }

  const pageMeta: Record<TabKey, { title: string; description: string }> = {
    dealers: { title: '合作分销商', description: '管理正式合作分销商档案、分组、购票资格、外部账号绑定与产品授权。' },
    approval: { title: '合作审核', description: '处理分销商主动申请合作的资料审核，通过后进入正式分销商档案。' },
    rule: { title: '申请合作规则', description: '配置分销商自助申请入口、服务条款、协议附件和资料提交要求。' },
    logs: { title: '分销商变更记录', description: '查询分销商新增、分组移动、启用禁用、结算方式调整等操作留痕。' },
  }

  return (
    <div>
      <PageHeader title={pageMeta[activeTab].title} description={pageMeta[activeTab].description} />

      {activeTab === 'dealers' && (
        <>
          <SearchPanel onSearch={() => fetchData(1)} onReset={handleReset} loading={loading}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">分销商名称</label>
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="分销商名称/账号/编号" className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">分组</label>
              <SelectField value={groupFilter} onChange={setGroupFilter} options={allGroupOptions} className="w-40" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">主体类型</label>
              <SelectField value={subjectFilter} onChange={setSubjectFilter} options={[{ value: 'all', label: '全部' }, ...subjectTypeOptions]} className="w-32" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">购票资格</label>
              <SelectField value={purchaseFilter} onChange={setPurchaseFilter} options={purchaseOptions} className="w-32" />
            </div>
          </SearchPanel>

          <div className="grid grid-cols-[260px_1fr] gap-4">
            <aside className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">分销商分组</h3>
                  <p className="mt-1 text-xs text-gray-500">用于批量授权、定价和结算配置</p>
                </div>
                <button onClick={() => setGroupDialogOpen(true)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setGroupFilter(group.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${groupFilter === group.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span>{group.name}</span>
                    <span className="text-xs text-gray-400">{group.dealerCount}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-500">分组下存在分销商时不可删除；分组会影响后续产品授权、定价规则和结算默认值。</div>
            </aside>

            <section className="min-w-0 bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="text-sm text-gray-500">已选择 <span className="font-medium text-gray-900">{selectedIds.length}</span> 个分销商</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMoveOpen(true)} disabled={selectedIds.length === 0} className="h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">移动分组</button>
                  <button onClick={() => setExchangeBindingOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50">
                    <Link2 className="h-4 w-4" />
                    航交所绑定
                  </button>
                  <button onClick={openCreate} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700">
                    <UserPlus className="w-4 h-4" />
                    添加分销商
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left"><input type="checkbox" checked={data.data.length > 0 && data.data.every((item) => selectedIds.includes(item.id))} onChange={togglePageRows} className="h-4 w-4 rounded border-gray-300 accent-gray-900" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">分销商名称</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">分组</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">主体类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">账号</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">联系人/手机号</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">可用额度</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">购票资格</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">结算方式</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">合作时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider min-w-[180px] whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={11} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
                    ) : data.data.length === 0 ? (
                      <tr><td colSpan={11} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
                    ) : data.data.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleRow(record.id)} className="h-4 w-4 rounded border-gray-300 accent-gray-900" /></td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{record.name}</div>
                          <div className="mt-1 text-xs text-gray-400 font-mono">{record.code}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{record.groupName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{subjectTypeLabels[record.subjectType]}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-mono">{record.account}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>{record.contact}</div>
                          <div className="text-xs text-gray-400 mt-1">{record.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(record.creditLimit)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700"><StatusBadge status={record.purchasePermission} /></td>
                        <td className="px-4 py-3 text-sm text-gray-700">{settlementMethodLabels[record.settlementMethod]}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{record.cooperationStartedAt}</td>
                        <td className="px-4 py-3 min-w-[180px] whitespace-nowrap">
                          <div className="flex flex-nowrap items-center gap-1">
                            <button onClick={() => openDetail(record)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded whitespace-nowrap">详情</button>
                            <button onClick={() => openEdit(record)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded whitespace-nowrap">编辑</button>
                            <button onClick={() => askToggle(record)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded whitespace-nowrap">{record.purchasePermission === 'enabled' ? '禁用' : '启用'}</button>
                            <button onClick={() => askDelete(record)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded whitespace-nowrap">删除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.total > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <span className="text-sm text-gray-500">共 {data.total} 条</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => fetchData(data.page - 1)} disabled={data.page <= 1} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">上一页</button>
                    <span className="px-3 py-1.5 text-sm text-gray-600">{data.page}</span>
                    <button onClick={() => fetchData(data.page + 1)} disabled={data.page >= Math.ceil(data.total / data.pageSize)} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">下一页</button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <FormDialog open={exchangeBindingOpen} title="航交所分销商绑定" width="max-w-6xl" onCancel={() => setExchangeBindingOpen(false)}>
        <div className="-mx-6 -my-4">
          <SearchPanel onSearch={() => undefined} onReset={resetBindingFilters}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">代理商名称</label>
              <input value={bindingKeyword} onChange={(event) => setBindingKeyword(event.target.value)} placeholder="航交所代理商/本地分销商" className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">是否有效</label>
              <SelectField value={bindingValidStatus} onChange={setBindingValidStatus} options={[{ value: 'all', label: '全部' }, { value: 'valid', label: '有效' }, { value: 'invalid', label: '无效' }]} className="w-32" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">是否绑定</label>
              <SelectField value={bindingStatus} onChange={setBindingStatus} options={[{ value: 'all', label: '全部' }, { value: 'bound', label: '已绑定' }, { value: 'unbound', label: '未绑定' }]} className="w-32" />
            </div>
          </SearchPanel>
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">航交所分销商绑定</h3>
                <p className="mt-1 text-xs text-gray-500">将外部航交所代理商同步记录绑定到本系统分销商，后续订单和结算按本地分销商口径归集。</p>
              </div>
              <button onClick={() => setBindings((current) => current.map((item) => ({ ...item, latestSyncAt: new Date().toISOString() })))} className="h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50">同步航交所数据</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">代理商代码</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">代理商名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">航交所账号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">联系人/手机号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">是否有效</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">绑定状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">绑定分销商</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">最后同步</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBindings.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
                  ) : filteredBindings.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{record.agencyCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.agencyName}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{record.exchangeAccount}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{record.contact}</div>
                        <div className="mt-1 text-xs text-gray-400">{record.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm"><StatusBadge status={record.validStatus === 'valid' ? 'enabled' : 'disabled'} /></td>
                      <td className="px-4 py-3 text-sm"><StatusBadge status={record.bindingStatus === 'bound' ? 'success' : 'pending'} /></td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.dealerName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(record.latestSyncAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => openBindingDialog(record)} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">{record.bindingStatus === 'bound' ? '重新绑定' : '绑定'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              绑定后外部订单按本地分销商进行产品授权、价格政策、授信额度和结算方式校验；未绑定记录只保留同步状态，不进入下单链路。
            </div>
          </section>
        </div>
      </FormDialog>

      <FormDialog open={ruleConfigOpen} title="配置申请合作规则" width="max-w-4xl" loading={ruleSaving} onCancel={() => setRuleConfigOpen(false)} onSubmit={saveRule}>
        {rule && (
          <div className="space-y-6">
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <input type="checkbox" checked={rule.allowSelfApply} onChange={(event) => setRule({ ...rule, allowSelfApply: event.target.checked })} className="h-4 w-4 rounded border-gray-300 accent-gray-900" />
              <span>
                <span className="block text-sm font-medium text-gray-900">支持分销商主动发起合作申请</span>
                <span className="mt-1 block text-xs text-gray-500">关闭后只能由后台人工添加合作分销商。</span>
              </span>
            </label>
            <div>
              <label className="mb-1 block text-sm text-gray-700">服务条款</label>
              <textarea value={rule.serviceTerms} onChange={(event) => setRule({ ...rule, serviceTerms: event.target.value })} rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">合作协议附件</label>
                <input value={rule.agreementFileName} onChange={(event) => setRule({ ...rule, agreementFileName: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-gray-400">原型阶段以文件名模拟上传。</p>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">可申请商户类型</label>
                <MultiCheckField value={rule.merchantTypes} options={subjectTypeOptions} onChange={(merchantTypes) => setRule({ ...rule, merchantTypes })} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm text-gray-700">提交附件说明</label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={rule.attachmentRequired} onChange={(event) => setRule({ ...rule, attachmentRequired: event.target.checked })} className="h-4 w-4 rounded border-gray-300 accent-gray-900" />
                  必填
                </label>
              </div>
              <textarea value={rule.attachmentRequirement} onChange={(event) => setRule({ ...rule, attachmentRequirement: event.target.value })} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100" />
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">最近更新：{rule.updatedBy} · {formatDateTime(rule.updatedAt)}</div>
          </div>
        )}
      </FormDialog>

      {activeTab === 'approval' && (
        <>
          <SearchPanel onSearch={() => undefined} onReset={resetApplicationFilters}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">分销商</label>
              <input value={applicationKeyword} onChange={(event) => setApplicationKeyword(event.target.value)} placeholder="分销商/账号/申请人" className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">审核状态</label>
              <SelectField value={applicationStatus} onChange={setApplicationStatus} options={[{ value: 'all', label: '全部' }, { value: 'pending', label: '待审核' }, { value: 'approved', label: '已通过' }, { value: 'rejected', label: '已驳回' }]} className="w-32" />
            </div>
          </SearchPanel>
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">合作审核</h3>
                <p className="mt-1 text-xs text-gray-500">处理分销商主动申请合作的资料审核，审核通过后可进入合作分销商档案维护。</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-yellow-700">待审核 {applications.filter((item) => item.status === 'pending').length}</span>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">已通过 {applications.filter((item) => item.status === 'approved').length}</span>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">已驳回 {applications.filter((item) => item.status === 'rejected').length}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">供应商名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">申请账号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">申请人/电话</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">主体类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">申请时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">审核人</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">审核时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApplications.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
                  ) : filteredApplications.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{record.dealerName}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{record.account}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{record.applicant}</div>
                        <div className="mt-1 text-xs text-gray-400">{record.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{subjectTypeLabels[record.subjectType]}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(record.appliedAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.auditedBy || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.auditedAt ? formatDateTime(record.auditedAt) : '-'}</td>
                      <td className="px-4 py-3 text-sm"><StatusBadge status={record.status} /></td>
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => openApprovalDetail(record)} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">{record.status === 'pending' ? '审核' : '查看'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              审核通过后，系统可根据申请资料生成分销商档案；驳回时需填写原因，便于申请方补充资料后再次提交。
            </div>
          </section>
        </>
      )}

      {activeTab === 'rule' && rule && (
        <>
          <SearchPanel onSearch={() => undefined} onReset={resetRuleFilters}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">规则名称</label>
              <input value={ruleKeyword} onChange={(event) => setRuleKeyword(event.target.value)} placeholder="规则编号/名称/适用场景" className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">状态</label>
              <SelectField value={ruleStatusFilter} onChange={setRuleStatusFilter} options={[{ value: 'all', label: '全部' }, { value: 'enabled', label: '启用' }, { value: 'disabled', label: '禁用' }]} className="w-32" />
            </div>
          </SearchPanel>

          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">申请合作规则列表</h3>
                <p className="mt-1 text-xs text-gray-500">用于维护分销商自助申请入口、协议确认、主体类型和资料提交要求。</p>
              </div>
              <button onClick={() => setRuleConfigOpen(true)} className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">配置规则</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">规则编号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">规则名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">适用场景</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">可申请主体</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">开放申请</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">附件要求</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">更新时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cooperationRuleRecords.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
                  ) : cooperationRuleRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{record.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.applyScene}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.merchantTypeText}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.allowSelfApply ? '允许' : '不允许'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.attachmentText}</td>
                      <td className="px-4 py-3 text-sm"><StatusBadge status={record.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{formatDateTime(record.updatedAt)}</div>
                        <div className="mt-1 text-xs text-gray-400">{record.updatedBy}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => setRuleConfigOpen(true)} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">配置</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              当前原型仅维护一条默认合作申请规则；列表结构已预留多规则扩展能力，可按不同主体、渠道来源或业务线拆分规则。
            </div>
          </section>
        </>
      )}

      {activeTab === 'logs' && (
        <>
          <SearchPanel onSearch={() => fetchLogs(1)} onReset={() => { setLogKeyword(''); setLogType('all'); setLogStatus('all'); setLogDateFrom(''); setLogDateTo('') }} loading={logsLoading}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">操作时间</label>
              <div className="flex items-center gap-2">
                <input type="date" value={logDateFrom} onChange={(event) => setLogDateFrom(event.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <span className="text-gray-400">-</span>
                <input type="date" value={logDateTo} onChange={(event) => setLogDateTo(event.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">操作类型</label>
              <SelectField value={logType} onChange={setLogType} options={logTypeOptions} className="w-40" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">操作状态</label>
              <SelectField value={logStatus} onChange={setLogStatus} options={logStatusOptions} className="w-32" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">分销商名称</label>
              <input value={logKeyword} onChange={(event) => setLogKeyword(event.target.value)} placeholder="分销商/操作内容" className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </SearchPanel>
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">操作类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">分销商名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">操作内容</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">操作时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">操作人员</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">操作状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logsLoading ? (
                    <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
                  ) : logs.data.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
                  ) : logs.data.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700">{changeTypeLabels[log.operationType]}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{log.dealerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{log.operationContent}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(log.operatedAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{log.operator}</td>
                      <td className="px-4 py-3 text-sm text-gray-700"><StatusBadge status={log.operationStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">鼠标移动到表格行，可查看该次操作涉及的分销商和处理结果。</div>
          </section>
        </>
      )}

      <FormDialog open={formOpen} title={editingId ? '编辑分销商' : '添加分销商'} width="max-w-5xl" loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <TextField label="分销商名称" required value={form.name} onChange={(name) => setForm({ ...form, name })} />
              <TextField label="合作编号" value={form.code} onChange={(code) => setForm({ ...form, code })} />
              <TextField label="账号" value={form.account} onChange={(account) => setForm({ ...form, account })} />
              <div><label className="block text-sm text-gray-700 mb-1">分组</label><SelectField value={form.groupId} onChange={(groupId) => setForm({ ...form, groupId })} options={groupOptions} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">主体类型</label><SelectField value={form.subjectType} onChange={(subjectType) => setForm({ ...form, subjectType })} options={subjectTypeOptions} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">渠道类型</label><MultiCheckField value={form.channelTypes} options={channelTypeOptions} onChange={(channelTypes) => setForm({ ...form, channelTypes })} /></div>
              <TextField label="联系人" required value={form.contact} onChange={(contact) => setForm({ ...form, contact })} />
              <TextField label="联系电话" required value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
              <TextField label="电子邮件" value={form.email} onChange={(email) => setForm({ ...form, email })} />
              <TextField label="地址" value={form.address} onChange={(address) => setForm({ ...form, address })} className="col-span-2" />
              <div><label className="block text-sm text-gray-700 mb-1">合作区域</label><SelectField value={form.region} onChange={(region) => setForm({ ...form, region })} options={regionOptions.map((option) => ({ value: option, label: option }))} /></div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">资质与结算</h4>
            <div className="grid grid-cols-3 gap-4">
              <TextField label="统一社会信用代码" value={form.socialCreditCode} onChange={(socialCreditCode) => setForm({ ...form, socialCreditCode })} />
              <TextField label="营业执照编号" value={form.businessLicenseNo} onChange={(businessLicenseNo) => setForm({ ...form, businessLicenseNo })} />
              <TextField label="业务经营许可证编号" value={form.travelAgencyPermitNo} onChange={(travelAgencyPermitNo) => setForm({ ...form, travelAgencyPermitNo })} />
              <NumberField label="授信额度" value={form.creditLimit} onChange={(creditLimit) => setForm({ ...form, creditLimit })} />
              <NumberField label="质保金" value={form.guaranteeAmount} onChange={(guaranteeAmount) => setForm({ ...form, guaranteeAmount })} />
              <div><label className="block text-sm text-gray-700 mb-1">结算方式</label><SelectField value={form.settlementMethod} onChange={(settlementMethod) => setForm({ ...form, settlementMethod })} options={settlementMethodOptions} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">结算周期</label><SelectField value={form.settlementCycle} onChange={(settlementCycle) => setForm({ ...form, settlementCycle })} options={settlementCycleOptions} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">分销商等级</label><SelectField value={form.level} onChange={(level) => setForm({ ...form, level })} options={levelOptions} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">退改权限</label><SelectField value={form.refundPermission} onChange={(refundPermission) => setForm({ ...form, refundPermission })} options={refundPermissionOptions} /></div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">价格策略与授权产品</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">结算价体系</label><MultiCheckField value={form.priceSystems} options={priceSystemOptions} onChange={(priceSystems) => setForm({ ...form, priceSystems })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <NumberField label="OTA 服务费率" value={form.otaServiceRate ?? 0} onChange={(otaServiceRate) => setForm({ ...form, otaServiceRate })} />
                <div><label className="block text-sm text-gray-700 mb-1">返利周期</label><SelectField value={form.rebateCycle} onChange={(rebateCycle) => setForm({ ...form, rebateCycle })} options={rebateCycleOptions} /></div>
                <div className="col-span-2"><label className="block text-sm text-gray-700 mb-1">返利维度</label><MultiCheckField value={form.rebateDimensions} options={rebateDimensionOptions} onChange={(rebateDimensions) => setForm({ ...form, rebateDimensions })} /></div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-700 mb-1">授权产品</label>
              <MultiCheckField value={form.authorizedProductIds} options={products.slice(0, 18).map((product) => ({ value: product.id, label: product.name }))} onChange={(authorizedProductIds) => setForm({ ...form, authorizedProductIds })} className="max-h-48 overflow-y-auto" />
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="分销商详情" width="w-[760px]" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基础信息">
              <DetailRow label="分销商名称" value={detail.name} />
              <DetailRow label="账号" value={detail.account} mono />
              <DetailRow label="分组" value={detail.groupName} />
              <DetailRow label="主体类型" value={subjectTypeLabels[detail.subjectType]} />
              <DetailRow label="认证状态" value={detail.certificationStatus === 'verified' ? '已认证' : '未认证'} />
              <DetailRow label="购票资格" value={<StatusBadge status={detail.purchasePermission} />} />
            </DetailCard>
            <DetailCard title="联系人信息">
              <DetailRow label="联系人" value={detail.contact} />
              <DetailRow label="联系电话" value={detail.phone} />
              <DetailRow label="电子邮件" value={detail.email} />
              <DetailRow label="地址" value={detail.address || '-'} />
            </DetailCard>
            <DetailCard title="资质信息">
              <DetailRow label="主体类型" value={subjectTypeLabels[detail.subjectType]} />
              <DetailRow label="营业执照编号" value={detail.businessLicenseNo || '-'} mono />
              <DetailRow label="业务经营许可证编号" value={detail.travelAgencyPermitNo || '-'} mono />
              <DetailRow label="资质文件" value={detail.qualificationFiles.length > 0 ? detail.qualificationFiles.join('、') : '-'} />
            </DetailCard>
            <DetailCard title="结算与授权">
              <DetailRow label="可用额度" value={formatCurrency(detail.creditLimit)} />
              <DetailRow label="质保金余额" value={formatCurrency(detail.guaranteeAmount)} />
              <DetailRow label="结算方式" value={settlementMethodLabels[detail.settlementMethod]} />
              <DetailRow label="结算周期" value={settlementLabels[detail.settlementCycle]} />
              <DetailRow label="价格体系" value={detail.priceSystems.map((item) => priceSystemLabels[item]).join('、')} />
              <DetailRow label="授权产品数" value={`${detail.authorizedProductIds.length} 个`} />
              <DetailRow label="退改权限" value={refundLabels[detail.refundPermission]} />
              <DetailRow label="返利规则" value={detail.rebateDimensions.length > 0 ? `${detail.rebateDimensions.map((item) => rebateDimensionLabels[item]).join('、')} / ${rebateCycleLabels[detail.rebateCycle]}` : '-'} />
            </DetailCard>
            {detail.purchasePermission === 'disabled' && (
              <DetailCard title="禁用信息">
                <DetailRow label="禁用原因" value={detail.disabledReason || '-'} />
                <DetailRow label="禁用至" value={detail.disabledUntil || '永久'} />
              </DetailCard>
            )}
          </>
        )}
      </DetailDrawer>

      <FormDialog open={bindingDialogOpen} title="绑定航交所分销商" width="max-w-3xl" onCancel={() => setBindingDialogOpen(false)} onSubmit={submitBinding} submitText="确认绑定">
        {bindingTarget && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <DetailMini label="航交所代理商" value={bindingTarget.agencyName} />
              <DetailMini label="代理商代码" value={bindingTarget.agencyCode} mono />
              <DetailMini label="外部账号" value={bindingTarget.exchangeAccount} mono />
              <DetailMini label="联系人" value={bindingTarget.contact} />
              <DetailMini label="联系电话" value={bindingTarget.phone} />
              <DetailMini label="当前状态" value={`${bindingStatusLabels[bindingTarget.bindingStatus]} / ${bindingTarget.validStatus === 'valid' ? '有效' : '无效'}`} />
            </div>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button onClick={() => setBindingMode('existing')} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${bindingMode === 'existing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>绑定已有分销商</button>
              <button onClick={() => setBindingMode('new')} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${bindingMode === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>创建新分销商</button>
            </div>
            {bindingMode === 'existing' ? (
              <div>
                <label className="mb-1 block text-sm text-gray-700">选择本地分销商</label>
                <SelectField value={selectedDealerId} onChange={setSelectedDealerId} options={dealerOptions.length > 0 ? dealerOptions : [{ value: '', label: '暂无可选分销商' }]} />
                <p className="mt-2 text-xs text-gray-500">适用于航交所代理商已经在本系统维护过档案的场景。</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <TextField label="分销商名称" required value={newBindingDealerName} onChange={setNewBindingDealerName} />
                <TextField label="联系人手机号" value={bindingTarget.phone} onChange={() => undefined} />
                <div className="col-span-2 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-700">
                  创建新分销商时，系统会按申请资料生成基础档案并返回初始账号密码；资质资料后续仍需在分销商详情中补齐。
                </div>
              </div>
            )}
          </div>
        )}
      </FormDialog>

      <FormDialog open={credentialOpen} title="账号创建成功" width="max-w-md" onCancel={() => setCredentialOpen(false)}>
        {credentialInfo && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="font-medium">已创建并添加为分销商</div>
                <div className="mt-2 leading-6">
                  账号：<span className="font-mono">{credentialInfo.account}</span><br />
                  密码：<span className="font-mono">{credentialInfo.password}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setCredentialOpen(false)} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">已记录账号密码，关闭</button>
          </div>
        )}
      </FormDialog>

      <FormDialog
        open={approvalDetailOpen}
        title={approvalTarget?.status === 'pending' ? '合作申请审核' : '合作申请详情'}
        width="max-w-4xl"
        onCancel={() => setApprovalDetailOpen(false)}
        onSubmit={approvalTarget?.status === 'pending' ? submitApproval : undefined}
        submitText="提交审核"
      >
        {approvalTarget && (
          <div className="space-y-5">
            <div className="grid grid-cols-[96px_1fr] gap-4 rounded-lg border border-gray-200 p-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                <Users className="h-9 w-9" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="text-base font-semibold text-gray-900">{approvalTarget.dealerName}</h4>
                  <StatusBadge status={approvalTarget.status} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3 text-sm text-gray-600">
                  <DetailMini label="申请账号" value={approvalTarget.account} mono />
                  <DetailMini label="申请人" value={approvalTarget.applicant} />
                  <DetailMini label="申请时间" value={formatDateTime(approvalTarget.appliedAt)} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">联系人信息</h4>
                <DetailRow label="联系人" value={approvalTarget.applicant} />
                <DetailRow label="联系电话" value={approvalTarget.phone} />
                <DetailRow label="电子邮件" value={approvalTarget.email} />
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">资质信息</h4>
                <DetailRow label="主体类型" value={subjectTypeLabels[approvalTarget.subjectType]} />
                <DetailRow label="企业名称" value={approvalTarget.companyName} />
                <DetailRow label="信用代码" value={approvalTarget.socialCreditCode} mono />
                <DetailRow label="许可证号" value={approvalTarget.travelAgencyPermitNo || '-'} mono />
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">附件材料</h4>
              <div className="grid grid-cols-3 gap-3">
                {approvalTarget.attachments.map((file) => (
                  <div key={file} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{file}</span>
                  </div>
                ))}
              </div>
            </div>
            {approvalTarget.status === 'pending' ? (
              <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                <div className="flex gap-3">
                  <button onClick={() => setApprovalDecision('approved')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${approvalDecision === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}><CheckCircle2 className="h-4 w-4" />通过</button>
                  <button onClick={() => setApprovalDecision('rejected')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${approvalDecision === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}><XCircle className="h-4 w-4" />驳回</button>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">审核备注</label>
                  <textarea value={approvalRemark} onChange={(event) => setApprovalRemark(event.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100" placeholder={approvalDecision === 'approved' ? '可填写通过说明' : '请填写驳回原因'} />
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">审核结果</h4>
                <DetailRow label="审核人" value={approvalTarget.auditedBy || '-'} />
                <DetailRow label="审核时间" value={approvalTarget.auditedAt ? formatDateTime(approvalTarget.auditedAt) : '-'} />
                <DetailRow label="审核备注" value={approvalTarget.remark || '-'} />
              </div>
            )}
          </div>
        )}
      </FormDialog>

      <FormDialog open={disableOpen} title="确认禁用购票资格" width="max-w-xl" onCancel={() => setDisableOpen(false)} onSubmit={submitDisable} submitText="确定禁用">
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">禁用后该分销商暂不可继续下单。请填写禁用原因，方便后续在变更记录和详情中追溯。</div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="radio" checked={disableType === 'temporary'} onChange={() => setDisableType('temporary')} className="accent-gray-900" />临时禁用</label>
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="radio" checked={disableType === 'permanent'} onChange={() => setDisableType('permanent')} className="accent-gray-900" />永久禁用</label>
          </div>
          {disableType === 'temporary' && <NumberField label="禁用天数" value={disableDays} onChange={setDisableDays} />}
          <div>
            <label className="mb-1 block text-sm text-gray-700">禁用原因 <span className="text-red-500">*</span></label>
            <textarea value={disableReason} onChange={(event) => setDisableReason(event.target.value)} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100" placeholder="请输入禁用原因" />
          </div>
        </div>
      </FormDialog>

      <FormDialog open={moveOpen} title="移动分组" width="max-w-lg" onCancel={() => setMoveOpen(false)} onSubmit={submitMoveGroup} submitText="确定">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">已选择 {selectedIds.length} 个分销商，移动后将使用目标分组的默认配置。</div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">移动分组至</label>
            <SelectField value={moveGroupId} onChange={setMoveGroupId} options={groupOptions} />
          </div>
        </div>
      </FormDialog>

      <FormDialog open={groupDialogOpen} title="添加分组" width="max-w-md" onCancel={() => setGroupDialogOpen(false)} onSubmit={addLocalGroup} submitText="保存">
        <TextField label="分组名称" required value={groupName} onChange={setGroupName} />
      </FormDialog>

      <ConfirmDialog open={confirmOpen} title={confirmConfig.type === 'delete' ? '删除分销商' : '启用购票资格'} message={confirmConfig.message} danger={confirmConfig.type === 'delete'} onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}

function TextField({ label, value, onChange, required, className = '' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
    </div>
  )
}

function DetailMini({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 truncate text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>{value || '-'}</div>
    </div>
  )
}
