import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'financeos_token'
const USER_KEY = 'financeos_user'

/** Memory cache so sync callers (isAuthenticated) stay cheap. */
let tokenMemory: string | null | undefined

function defaultBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv) return fromEnv
  // Android emulator reaches host machine via 10.0.2.2
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api/v1'
  return 'http://localhost:5000/api/v1'
}

export const BASE_URL = defaultBaseUrl()

export class ApiError extends Error {
  status?: number
  code?: string
  details?: unknown

  constructor(message: string, { status, code, details }: { status?: number; code?: string; details?: unknown } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type AuthListener = () => void
const authListeners = new Set<AuthListener>()

export function onUnauthorized(listener: AuthListener) {
  authListeners.add(listener)
  return () => {
    authListeners.delete(listener)
  }
}

function emitUnauthorized() {
  authListeners.forEach((fn) => fn())
}

async function storageGet(key: string) {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  }
  return SecureStore.getItemAsync(key)
}

async function storageSet(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

async function storageDelete(key: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}

export async function getToken() {
  if (tokenMemory !== undefined) return tokenMemory
  tokenMemory = await storageGet(TOKEN_KEY)
  return tokenMemory
}

export function getTokenSync() {
  return tokenMemory ?? null
}

export async function setToken(token: string | null) {
  tokenMemory = token
  if (token) await storageSet(TOKEN_KEY, token)
  else await storageDelete(TOKEN_KEY)
}

export async function clearToken() {
  tokenMemory = null
  await storageDelete(TOKEN_KEY)
}

export async function getStoredUser<T = unknown>(): Promise<T | null> {
  const raw = await storageGet(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setStoredUser(user: unknown | null) {
  if (user) await storageSet(USER_KEY, JSON.stringify(user))
  else await storageDelete(USER_KEY)
}

type ApiOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  headers?: Record<string, string>
  withMeta?: boolean
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {}, withMeta = false } = options

  const opts: RequestInit = {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  }

  if (auth) {
    const token = await getToken()
    if (token) (opts.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, opts)
  let payload: any = null
  const text = await res.text()
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = { success: false, error: { message: text || res.statusText } }
  }

  if (!res.ok || payload?.success === false) {
    if (res.status === 401 && auth) {
      await clearToken()
      await setStoredUser(null)
      emitUnauthorized()
    }
    throw new ApiError(payload?.error?.message || 'Request failed', {
      status: res.status,
      code: payload?.error?.code,
      details: payload?.error?.details,
    })
  }

  if (withMeta) return { data: payload?.data, meta: payload?.meta ?? null } as T
  return payload?.data as T
}
