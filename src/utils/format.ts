// ========== 格式化工具 ==========

export function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    enabled: '启用',
    disabled: '禁用',
    draft: '草稿',
    pending: '待审核',
    approved: '已审核',
    rejected: '已驳回',
    closed: '已关闭',
    voided: '已作废',
    cooperating: '合作中',
    terminated: '已终止',
    effective: '有效',
    released: '已释放',
    expired: '已逾期',
    pending_accept: '待接单',
    accepted: '已接单',
    signed: '已签约',
    in_progress: '执行中',
    completed: '已完成',
    cancelled: '已取消',
    processing: '处理中',
    not_started: '未开始',
    ongoing: '进行中',
    pending_check: '待勾稽',
    reconciled: '已对账',
    diff_pending: '差异待处理',
    diff_resolved: '差异已处理',
    unpaid: '未付',
    partial: '部分完成',
    paid: '已付',
    unsettled: '未结清',
    settled: '已结清',
    published: '已发布',
    success: '成功',
    failed: '失败',
  }
  return map[status] || status
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    enabled: 'bg-green-100 text-green-700',
    disabled: 'bg-gray-100 text-gray-500',
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-600',
    closed: 'bg-gray-100 text-gray-500',
    voided: 'bg-red-100 text-red-600',
    cooperating: 'bg-green-100 text-green-700',
    terminated: 'bg-gray-100 text-gray-500',
    effective: 'bg-green-100 text-green-700',
    released: 'bg-gray-100 text-gray-500',
    expired: 'bg-red-100 text-red-600',
    pending_accept: 'bg-orange-100 text-orange-700',
    accepted: 'bg-blue-100 text-blue-700',
    signed: 'bg-green-100 text-green-700',
    in_progress: 'bg-sky-100 text-sky-700',
    completed: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-600',
    processing: 'bg-yellow-100 text-yellow-700',
    not_started: 'bg-gray-100 text-gray-600',
    ongoing: 'bg-green-100 text-green-700',
    pending_check: 'bg-gray-100 text-gray-600',
    reconciled: 'bg-green-100 text-green-700',
    diff_pending: 'bg-orange-100 text-orange-700',
    diff_resolved: 'bg-blue-100 text-blue-700',
    unpaid: 'bg-red-100 text-red-600',
    partial: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    unsettled: 'bg-red-100 text-red-600',
    settled: 'bg-green-100 text-green-700',
    published: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-600',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}
