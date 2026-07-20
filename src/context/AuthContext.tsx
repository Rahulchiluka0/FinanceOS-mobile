import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, usersApi } from '@/api'
import {
  clearToken,
  getStoredUser,
  getToken,
  getTokenSync,
  onUnauthorized,
  setStoredUser,
  setToken,
} from '@/api/client'
import type { User } from '@/types'

type AuthContextValue = {
  user: User | null
  bootstrapping: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: { name: string; email: string; password: string }) => Promise<User>
  logout: () => void
  updateProfile: (updates: Record<string, unknown>) => Promise<User>
  changePassword: (body: { currentPassword: string; newPassword: string }) => Promise<unknown>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [hasToken, setHasToken] = useState(false)

  const persist = useCallback(async (nextUser: User, token: string) => {
    await setToken(token)
    await setStoredUser(nextUser)
    setHasToken(true)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    authApi.logout().catch(() => {})
    clearToken()
    setStoredUser(null)
    setHasToken(false)
    setUser(null)
  }, [])

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      setHasToken(false)
      setUser(null)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const token = await getToken()
      if (!token) {
        const cached = await getStoredUser<User>()
        if (!cancelled) {
          setUser(cached)
          setHasToken(false)
          setBootstrapping(false)
        }
        return
      }
      setHasToken(true)
      try {
        const cached = await getStoredUser<User>()
        if (!cancelled && cached) setUser(cached)
        const me = (await usersApi.me()) as User
        if (!cancelled) {
          await setStoredUser(me)
          setUser(me)
        }
      } catch {
        if (!cancelled) {
          await clearToken()
          await setStoredUser(null)
          setHasToken(false)
          setUser(null)
        }
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      bootstrapping,
      isAuthenticated: Boolean(user && (hasToken || getTokenSync())),
      login: async (email, password) => {
        const data = await authApi.login({ email, password })
        await persist(data.user, data.token)
        return data.user
      },
      register: async ({ name, email, password }) => {
        const data = await authApi.register({ name, email, password })
        await persist(data.user, data.token)
        return data.user
      },
      logout,
      updateProfile: async (updates) => {
        const next = (await usersApi.updateMe(updates)) as User
        await setStoredUser(next)
        setUser(next)
        return next
      },
      changePassword: async (body) => usersApi.changePassword(body),
    }),
    [user, bootstrapping, hasToken, persist, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
