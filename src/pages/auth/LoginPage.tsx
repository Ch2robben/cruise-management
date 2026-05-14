import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [account, setAccount] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ account?: string; password?: string }>({})

  const validate = () => {
    const errs: { account?: string; password?: string } = {}
    if (!account.trim()) errs.account = '请输入账号'
    if (!password) errs.password = '请输入密码'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError('')
    const success = await login(account, password)
    setLoading(false)
    if (success) {
      navigate('/voyage/list')
    } else {
      setError('账号或密码错误')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-900 text-center">登录</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">账号 / 手机号</label>
        <input
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          placeholder="请输入账号或手机号"
        />
        {fieldErrors.account && <p className="text-red-500 text-xs mt-1">{fieldErrors.account}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          placeholder="请输入密码"
        />
        {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? '登录中...' : '登 录'}
      </button>

      <p className="text-sm text-gray-500 text-center">
        还没有账号？{' '}
        <Link to="/register" className="text-gray-900 font-medium hover:underline">
          立即注册
        </Link>
      </p>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 text-center">演示账号：admin / 123456</p>
      </div>
    </form>
  )
}
