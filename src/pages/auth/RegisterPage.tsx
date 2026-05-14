import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const registerUser = useAuthStore((s) => s.register)
  const [form, setForm] = useState({
    companyName: '', name: '', phone: '', password: '', confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.companyName.trim()) errs.companyName = '请输入企业名称'
    if (!form.name.trim()) errs.name = '请输入用户姓名'
    if (!form.phone.trim() || form.phone.length !== 11) errs.phone = '请输入11位手机号'
    if (!form.password || form.password.length < 6) errs.password = '密码至少6位'
    if (form.password !== form.confirmPassword) errs.confirmPassword = '两次密码不一致'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await registerUser({
      companyName: form.companyName,
      name: form.name,
      phone: form.phone,
      password: form.password,
    })
    setLoading(false)
    navigate('/voyage/list')
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 text-center">注册</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">企业名称 <span className="text-red-500">*</span></label>
        <input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} className={inputClass} placeholder="请输入企业名称" />
        {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">用户姓名 <span className="text-red-500">*</span></label>
        <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} placeholder="请输入用户姓名" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号 <span className="text-red-500">*</span></label>
        <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} placeholder="请输入11位手机号" />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">密码 <span className="text-red-500">*</span></label>
        <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className={inputClass} placeholder="至少6位密码" />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码 <span className="text-red-500">*</span></label>
        <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className={inputClass} placeholder="再次输入密码" />
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
      </div>

      <button type="submit" disabled={loading} className="w-full py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? '注册中...' : '注 册'}
      </button>

      <p className="text-sm text-gray-500 text-center">
        已有账号？{' '}
        <Link to="/login" className="text-gray-900 font-medium hover:underline">立即登录</Link>
      </p>
    </form>
  )
}
