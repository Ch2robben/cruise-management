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
    closed: '已关闭',
    voided: '已作废',
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
    closed: 'bg-gray-100 text-gray-500',
    voided: 'bg-red-100 text-red-600',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}
