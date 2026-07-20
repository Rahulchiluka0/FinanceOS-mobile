import { api, BASE_URL, getToken } from './client'

export const authApi = {
  login: (body: { email: string; password: string }) =>
    api<{ user: any; token: string }>('/auth/login', { method: 'POST', body, auth: false }),
  register: (body: { name: string; email: string; password: string }) =>
    api<{ user: any; token: string }>('/auth/register', { method: 'POST', body, auth: false }),
  logout: () => api('/auth/logout', { method: 'POST', body: {}, auth: false }),
  forgotPassword: (email: string) =>
    api<{ message?: string; resetUrl?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false,
    }),
  resetPassword: (body: { token: string; password: string }) =>
    api('/auth/reset-password', { method: 'POST', body, auth: false }),
}

export const usersApi = {
  me: () => api('/users/me'),
  updateMe: (body: Record<string, unknown>) => api('/users/me', { method: 'PATCH', body }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api('/users/me/password', { method: 'POST', body }),
}

export const dashboardApi = {
  get: () => api('/dashboard'),
}

export const accountsApi = {
  list: () => api('/accounts'),
  create: (body: Record<string, unknown>) => api('/accounts', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) =>
    api(`/accounts/${id}`, { method: 'PATCH', body }),
  archive: (id: string) => api(`/accounts/${id}/archive`, { method: 'POST', body: {} }),
  transfer: (body: Record<string, unknown>) => api('/accounts/transfer', { method: 'POST', body }),
}

export const categoriesApi = {
  list: () => api('/categories'),
  create: (body: Record<string, unknown>) => api('/categories', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) =>
    api(`/categories/${id}`, { method: 'PATCH', body }),
  archive: (id: string) => api(`/categories/${id}/archive`, { method: 'POST', body: {} }),
}

export const transactionsApi = {
  list: (params: Record<string, unknown> = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString()
    return api(`/transactions${q ? `?${q}` : ''}`)
  },
  listPage: (params: Record<string, unknown> = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString()
    return api<{ data: any[]; meta: any }>(`/transactions${q ? `?${q}` : ''}`, { withMeta: true })
  },
  create: (body: Record<string, unknown>) => api('/transactions', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) =>
    api(`/transactions/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/transactions/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids: string[]) =>
    api('/transactions/bulk-delete', { method: 'POST', body: { ids } }),
  duplicate: (id: string) => api(`/transactions/${id}/duplicate`, { method: 'POST', body: {} }),
  favorite: (id: string) => api(`/transactions/${id}/favorite`, { method: 'POST', body: {} }),
}

export const tagsApi = {
  list: () => api('/tags'),
  create: (body: Record<string, unknown>) => api('/tags', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) => api(`/tags/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/tags/${id}`, { method: 'DELETE' }),
}

export const budgetsApi = {
  list: () => api('/budgets'),
  create: (body: Record<string, unknown>) => api('/budgets', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) =>
    api(`/budgets/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/budgets/${id}`, { method: 'DELETE' }),
}

export const goalsApi = {
  list: () => api('/goals'),
  create: (body: Record<string, unknown>) => api('/goals', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) => api(`/goals/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/goals/${id}`, { method: 'DELETE' }),
  deposit: (id: string, amount: number) =>
    api(`/goals/${id}/deposit`, { method: 'POST', body: { amount } }),
  withdraw: (id: string, amount: number) =>
    api(`/goals/${id}/withdraw`, { method: 'POST', body: { amount } }),
}

export const recurringApi = {
  list: () => api('/recurring'),
  create: (body: Record<string, unknown>) => api('/recurring', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) =>
    api(`/recurring/${id}`, { method: 'PATCH', body }),
  pause: (id: string) => api(`/recurring/${id}/pause`, { method: 'POST', body: {} }),
  resume: (id: string) => api(`/recurring/${id}/resume`, { method: 'POST', body: {} }),
  end: (id: string) => api(`/recurring/${id}/end`, { method: 'POST', body: {} }),
  skip: (id: string) => api(`/recurring/${id}/skip`, { method: 'POST', body: {} }),
  remove: (id: string) => api(`/recurring/${id}`, { method: 'DELETE' }),
}

export const billsApi = {
  list: () => api('/bills'),
  create: (body: Record<string, unknown>) => api('/bills', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) => api(`/bills/${id}`, { method: 'PATCH', body }),
  pay: (id: string) => api(`/bills/${id}/pay`, { method: 'POST', body: {} }),
  remove: (id: string) => api(`/bills/${id}`, { method: 'DELETE' }),
}

export const subscriptionsApi = {
  list: () => api('/subscriptions'),
  create: (body: Record<string, unknown>) => api('/subscriptions', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) =>
    api(`/subscriptions/${id}`, { method: 'PATCH', body }),
  pause: (id: string) => api(`/subscriptions/${id}/pause`, { method: 'POST', body: {} }),
  resume: (id: string) => api(`/subscriptions/${id}/resume`, { method: 'POST', body: {} }),
  remove: (id: string) => api(`/subscriptions/${id}`, { method: 'DELETE' }),
}

export const loansApi = {
  list: () => api('/loans'),
  create: (body: Record<string, unknown>) => api('/loans', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) => api(`/loans/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/loans/${id}`, { method: 'DELETE' }),
  schedule: (id: string) => api(`/loans/${id}/schedule`),
}

export const investmentsApi = {
  list: () => api('/investments'),
  create: (body: Record<string, unknown>) => api('/investments', { method: 'POST', body }),
  update: (id: string, body: Record<string, unknown>) =>
    api(`/investments/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/investments/${id}`, { method: 'DELETE' }),
}

export const notificationsApi = {
  list: (unread?: boolean) => api(`/notifications${unread ? '?unread=true' : ''}`),
  markRead: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH', body: {} }),
  markAllRead: () => api('/notifications/read-all', { method: 'POST', body: {} }),
}

export const calendarApi = {
  get: (year: number, month: number) => api(`/calendar?year=${year}&month=${month}`),
}

export const searchApi = {
  query: (q: string) => api(`/search?q=${encodeURIComponent(q)}`),
}

export const reportsApi = {
  overview: () => api('/reports/overview'),
  cashflow: () => api('/reports/cashflow'),
  categories: () => api('/reports/categories'),
}

export const fxApi = {
  rates: () => api('/fx/rates'),
  convert: (body: { amount: number; from: string; to: string }) =>
    api('/fx/convert', { method: 'POST', body }),
}

export const aiApi = {
  suggestions: () => api('/ai/suggestions'),
  chat: (message: string, opts: { threadId?: string | null; client?: 'web' | 'mobile' } = {}) =>
    api<{
      reply: string
      answer?: string
      facts?: Array<{ key?: string; label?: string; value?: string }>
      citations?: Array<{ period?: string; filters?: string }>
      threadId?: string
      provider?: string
    }>('/ai/chat', {
      method: 'POST',
      body: {
        message,
        threadId: opts.threadId || undefined,
        client: opts.client || 'mobile',
      },
    }),
  chatThreads: () => api<Array<{ id: string; title: string; updatedAt: string }>>('/ai/chat/threads'),
  chatThread: (id: string) => api<any>(`/ai/chat/threads/${id}`),
  dashboard: () => api<any>('/ai/dashboard'),
  profile: () => api<any>('/ai/profile'),
  refreshProfile: () => api<any>('/ai/profile/refresh', { method: 'POST', body: {} }),
  healthScore: () => api<any>('/ai/health-score'),
  patterns: (period?: string) =>
    api<any>(`/ai/patterns${period ? `?period=${encodeURIComponent(period)}` : ''}`),
  refreshPatterns: () => api<any>('/ai/patterns/refresh', { method: 'POST', body: {} }),
  insights: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString()
    return api<any>(`/ai/insights${q ? `?${q}` : ''}`)
  },
  refreshInsights: () => api<any>('/ai/insights/refresh', { method: 'POST', body: {} }),
  dismissInsight: (id: string) => api(`/ai/insights/${id}/dismiss`, { method: 'POST', body: {} }),
  actInsight: (id: string) => api(`/ai/insights/${id}/act`, { method: 'POST', body: {} }),
  smartInsights: () => api<any>('/insights/smart'),
}



export const dataApi = {
  backup: () => api('/data/backup'),
  exportCsv: async () => {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/data/export/csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('CSV export failed')
    return res.text()
  },
  importTransactions: (body: Record<string, unknown>) =>
    api('/data/import', { method: 'POST', body }),
  restore: (body: unknown) => api('/data/restore', { method: 'POST', body }),
}

export const jobsApi = {
  run: () => api('/jobs/run', { method: 'POST', body: {} }),
}
