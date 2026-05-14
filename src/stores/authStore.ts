import { create } from 'zustand'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  isLoggedIn: boolean
  login: (account: string, password: string) => Promise<boolean>
  register: (data: { companyName: string; name: string; phone: string; password: string }) => Promise<boolean>
  logout: () => void
}

const STORAGE_KEY = 'cruise_auth'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const savedUser = loadUser()
  return {
    user: savedUser,
    isLoggedIn: !!savedUser,

    login: async (account, password) => {
      // Mock login
      await new Promise((r) => setTimeout(r, 500))
      if (account === 'admin' && password === '123456') {
        const user: AuthUser = {
          id: 'u001',
          account: 'admin',
          name: '系统管理员',
          roleName: '系统管理员',
          token: 'mock-token-' + Date.now(),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
        set({ user, isLoggedIn: true })
        return true
      }
      return false
    },

    register: async (data) => {
      // Mock register
      await new Promise((r) => setTimeout(r, 500))
      const user: AuthUser = {
        id: 'u' + Date.now().toString(36),
        account: data.phone,
        name: data.name,
        roleName: '普通用户',
        token: 'mock-token-' + Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      set({ user, isLoggedIn: true })
      return true
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY)
      set({ user: null, isLoggedIn: false })
    },
  }
})
