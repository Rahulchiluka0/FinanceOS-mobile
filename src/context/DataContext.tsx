import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  accountsApi,
  categoriesApi,
  transactionsApi,
  tagsApi,
  budgetsApi,
  goalsApi,
  recurringApi,
  billsApi,
  subscriptionsApi,
  loansApi,
  investmentsApi,
  notificationsApi,
  dashboardApi,
  reportsApi,
} from '@/api'
import type {
  Account,
  AppNotification,
  Budget,
  CashFlowPoint,
  Category,
  CategorySpend,
  DashboardData,
  DataKey,
  Goal,
  Investment,
  Loan,
  Recurring,
  Bill,
  Subscription,
  Tag,
  Transaction,
} from '@/types'

type DataState = {
  accounts: Account[]
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  goals: Goal[]
  recurring: Recurring[]
  tags: Tag[]
  bills: Bill[]
  subscriptions: Subscription[]
  loans: Loan[]
  investments: Investment[]
  notifications: AppNotification[]
  dashboard: DashboardData | null
  cashFlow: CashFlowPoint[]
  categorySpend: CategorySpend[]
}

const empty: DataState = {
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  goals: [],
  recurring: [],
  tags: [],
  bills: [],
  subscriptions: [],
  loans: [],
  investments: [],
  notifications: [],
  dashboard: null,
  cashFlow: [],
  categorySpend: [],
}

const LOADERS: Record<DataKey, () => Promise<any>> = {
  accounts: () => accountsApi.list(),
  transactions: () => transactionsApi.list(),
  categories: () => categoriesApi.list(),
  budgets: () => budgetsApi.list(),
  goals: () => goalsApi.list(),
  recurring: () => recurringApi.list(),
  tags: () => tagsApi.list(),
  bills: () => billsApi.list(),
  subscriptions: () => subscriptionsApi.list(),
  loans: () => loansApi.list(),
  investments: () => investmentsApi.list(),
  notifications: () => notificationsApi.list(),
  dashboard: () => dashboardApi.get(),
  cashFlow: () => reportsApi.cashflow().catch(() => []),
  categorySpend: () => reportsApi.categories().catch(() => []),
}

function uniq(keys: DataKey[]) {
  return [...new Set(keys.filter(Boolean))]
}

type DataContextValue = DataState & {
  loading: boolean
  loadingKeys: Set<string>
  error: string | null
  ensureData: (keys: DataKey[]) => Promise<void>
  refresh: (keys: DataKey[]) => Promise<void>
  refreshAll: () => Promise<void>
  unreadCount: number
  saveAccount: (data: any) => Promise<void>
  archiveAccount: (id: string) => Promise<void>
  transferMoney: (input: { fromId: string; toId: string; amount: number }) => Promise<void>
  saveTransaction: (data: any) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  deleteTransactions: (ids: string[]) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  duplicateTransaction: (id: string) => Promise<void>
  saveCategory: (data: any) => Promise<void>
  archiveCategory: (id: string) => Promise<void>
  saveBudget: (data: any) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  saveGoal: (data: any) => Promise<void>
  adjustGoal: (id: string, delta: number) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  saveRecurring: (data: any) => Promise<void>
  setRecurringStatus: (id: string, status: string) => Promise<void>
  skipRecurring: (id: string) => Promise<void>
  deleteRecurring: (id: string) => Promise<void>
  saveTag: (data: any) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  saveBill: (data: any) => Promise<void>
  toggleBillPaid: (id: string) => Promise<void>
  deleteBill: (id: string) => Promise<void>
  saveSubscription: (data: any) => Promise<void>
  setSubscriptionStatus: (id: string, status: string) => Promise<void>
  deleteSubscription: (id: string) => Promise<void>
  saveLoan: (data: any) => Promise<void>
  deleteLoan: (id: string) => Promise<void>
  saveInvestment: (data: any) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState<DataState>(empty)
  const [loadingKeys, setLoadingKeys] = useState(() => new Set<string>())
  const [error, setError] = useState<string | null>(null)
  const loadedRef = useRef(new Set<string>())
  const inflightRef = useRef(new Map<string, Promise<any>>())
  const stateRef = useRef(state)
  stateRef.current = state

  const patchState = useCallback((partial: Partial<DataState>) => {
    setState((prev) => ({ ...prev, ...partial }))
  }, [])

  const loadResources = useCallback(
    async (keys: DataKey[], { force = false } = {}) => {
      if (!isAuthenticated) return
      const wanted = uniq(keys)

      const startFetch = (key: DataKey) => {
        const promise = LOADERS[key]()
          .then((data) => {
            loadedRef.current.add(key)
            return { key, data }
          })
          .finally(() => {
            inflightRef.current.delete(key)
          })
        inflightRef.current.set(key, promise)
        return promise
      }

      const toFetch: Promise<any>[] = []
      for (const key of wanted) {
        if (!LOADERS[key]) continue
        if (inflightRef.current.has(key)) {
          if (force) {
            toFetch.push(
              inflightRef.current
                .get(key)!
                .catch(() => null)
                .then(() => startFetch(key)),
            )
          } else {
            toFetch.push(inflightRef.current.get(key)!.then(() => null))
          }
          continue
        }
        if (!force && loadedRef.current.has(key)) continue
        toFetch.push(startFetch(key))
      }

      if (!toFetch.length) return

      setLoadingKeys((prev) => {
        const next = new Set(prev)
        wanted.forEach((k) => next.add(k))
        return next
      })
      setError(null)

      try {
        const results = await Promise.all(toFetch)
        const partial: Partial<DataState> = {}
        for (const result of results) {
          if (!result) continue
          const { key, data } = result
          if (key === 'cashFlow' || key === 'categorySpend') {
            ;(partial as any)[key] = Array.isArray(data) ? data : []
          } else {
            ;(partial as any)[key] = data
          }
        }
        if (Object.keys(partial).length) patchState(partial)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
        throw err
      } finally {
        setLoadingKeys((prev) => {
          const next = new Set(prev)
          wanted.forEach((k) => next.delete(k))
          return next
        })
      }
    },
    [isAuthenticated, patchState],
  )

  const ensureData = useCallback(
    (keys: DataKey[]) => loadResources(keys, { force: false }),
    [loadResources],
  )

  const refresh = useCallback(
    (keys: DataKey[]) => loadResources(keys, { force: true }),
    [loadResources],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      loadedRef.current.clear()
      inflightRef.current.clear()
      setState(empty)
      setLoadingKeys(new Set())
      setError(null)
      return
    }
    ensureData(['notifications'])
  }, [isAuthenticated, ensureData])

  const resolveAccountId = useCallback((data: any) => {
    if (data.accountId) return data.accountId
    const found = stateRef.current.accounts.find(
      (a) => a.name === data.account || a.id === data.account,
    )
    return found?.id
  }, [])

  const resolveCategoryId = useCallback((data: any) => {
    if (data.categoryId) return data.categoryId
    const found = stateRef.current.categories.find(
      (c) => c.name === data.category || c.id === data.category,
    )
    return found?.id || null
  }, [])

  const value = useMemo<DataContextValue>(() => {
    const {
      accounts,
      categories,
      budgets,
      bills,
      notifications,
    } = state

    return {
      ...state,
      loading: loadingKeys.size > 0,
      loadingKeys,
      error,
      ensureData,
      refresh,
      refreshAll: () =>
        refresh([
          'accounts',
          'transactions',
          'categories',
          'budgets',
          'goals',
          'recurring',
          'tags',
          'bills',
          'subscriptions',
          'loans',
          'investments',
          'notifications',
          'dashboard',
          'cashFlow',
          'categorySpend',
        ]),
      unreadCount: notifications.filter((n) => !n.read).length,

      saveAccount: async (data) => {
        const payload = {
          name: data.name,
          type: data.type,
          openingBalance: Number(data.openingBalance) || 0,
          balance: data.balance !== undefined ? Number(data.balance) : undefined,
          color: data.color,
        }
        if (data.id) await accountsApi.update(data.id, payload)
        else await accountsApi.create(payload)
        await refresh(['accounts', 'dashboard'])
      },
      archiveAccount: async (id) => {
        await accountsApi.archive(id)
        await refresh(['accounts', 'dashboard'])
      },
      transferMoney: async ({ fromId, toId, amount }) => {
        await accountsApi.transfer({
          fromId: String(fromId),
          toId: String(toId),
          amount: Number(amount),
        })
        await refresh(['accounts', 'dashboard', 'transactions'])
      },

      saveTransaction: async (data) => {
        const accountId = resolveAccountId(data)
        const categoryId = resolveCategoryId(data)
        if (!accountId) throw new Error('Account is required')

        let toAccountId = data.toAccountId || null
        if (!toAccountId && data.toAccount) {
          toAccountId =
            stateRef.current.accounts.find(
              (a) => a.name === data.toAccount || a.id === data.toAccount,
            )?.id || null
        }
        if (data.type === 'transfer') {
          if (!toAccountId) throw new Error('Destination account is required for transfers')
          if (toAccountId === accountId) throw new Error('Choose two different accounts for a transfer')
        }

        const payload = {
          title: data.title,
          type: data.type,
          amount: Number(data.amount),
          accountId,
          toAccountId: data.type === 'transfer' ? toAccountId : null,
          categoryId: data.type === 'transfer' ? null : categoryId,
          date: data.date,
          notes: data.notes || '',
          favorite: Boolean(data.favorite),
          tags: data.tags || [],
          receiptUrl: data.receipt ? data.receiptUrl || 'attached' : null,
        }
        if (data.id) await transactionsApi.update(data.id, payload)
        else await transactionsApi.create(payload)
        await refresh([
          'transactions',
          'accounts',
          'budgets',
          'dashboard',
          'cashFlow',
          'categorySpend',
          'tags',
          'notifications',
        ])
      },
      deleteTransaction: async (id) => {
        await transactionsApi.remove(id)
        await refresh([
          'transactions',
          'accounts',
          'budgets',
          'dashboard',
          'cashFlow',
          'categorySpend',
          'notifications',
        ])
      },
      deleteTransactions: async (ids) => {
        await transactionsApi.bulkDelete(ids)
        await refresh([
          'transactions',
          'accounts',
          'budgets',
          'dashboard',
          'cashFlow',
          'categorySpend',
          'notifications',
        ])
      },
      toggleFavorite: async (id) => {
        await transactionsApi.favorite(id)
        await refresh(['transactions'])
      },
      duplicateTransaction: async (id) => {
        await transactionsApi.duplicate(id)
        await refresh([
          'transactions',
          'accounts',
          'budgets',
          'dashboard',
          'cashFlow',
          'categorySpend',
          'notifications',
        ])
      },

      saveCategory: async (data) => {
        let parentId = data.parentId || null
        if (!parentId && data.parent) {
          parentId =
            stateRef.current.categories.find(
              (c) => c.name === data.parent && !c.parentId,
            )?.id || null
        }
        const payload = {
          name: data.name,
          type: data.type,
          color: data.color,
          icon: data.icon,
          parentId,
        }
        if (data.id) await categoriesApi.update(data.id, payload)
        else await categoriesApi.create(payload)
        await refresh(['categories'])
      },
      archiveCategory: async (id) => {
        await categoriesApi.archive(id)
        await refresh(['categories'])
      },

      saveBudget: async (data) => {
        const categoryId =
          data.categoryId || categories.find((c) => c.name === data.category)?.id
        if (!categoryId) throw new Error('Category is required')
        const period = String(data.period || 'monthly').toLowerCase()
        const payload = {
          categoryId,
          period,
          limitAmount: Number(data.limit ?? data.limitAmount),
          alertAt: Number(data.alertAt ?? 80),
        }
        if (data.id) await budgetsApi.update(data.id, payload)
        else await budgetsApi.create(payload)
        await refresh(['budgets', 'dashboard', 'notifications'])
      },
      deleteBudget: async (id) => {
        await budgetsApi.remove(id)
        await refresh(['budgets', 'dashboard', 'notifications'])
      },

      saveGoal: async (data) => {
        const payload = {
          name: data.name,
          targetAmount: Number(data.target ?? data.targetAmount),
          currentAmount: Number(data.current ?? data.currentAmount ?? 0),
          deadline: data.deadline || null,
          color: data.color,
        }
        if (data.id) await goalsApi.update(data.id, payload)
        else await goalsApi.create(payload)
        await refresh(['goals', 'dashboard'])
      },
      adjustGoal: async (id, delta) => {
        if (delta >= 0) await goalsApi.deposit(id, delta)
        else await goalsApi.withdraw(id, Math.abs(delta))
        await refresh(['goals', 'dashboard'])
      },
      deleteGoal: async (id) => {
        await goalsApi.remove(id)
        await refresh(['goals', 'dashboard'])
      },

      saveRecurring: async (data) => {
        const payload = {
          title: data.title,
          type: data.type,
          amount: Number(data.amount),
          frequency: String(data.frequency || 'monthly').toLowerCase(),
          nextDate: data.nextDate,
          accountId: data.accountId || resolveAccountId(data) || null,
          categoryId: data.categoryId || resolveCategoryId(data) || null,
        }
        if (data.id) await recurringApi.update(data.id, payload)
        else await recurringApi.create(payload)
        await refresh(['recurring', 'dashboard'])
      },
      setRecurringStatus: async (id, status) => {
        const prev = stateRef.current.recurring
        patchState({
          recurring: prev.map((r) => (r.id === id ? { ...r, status } : r)),
        })
        try {
          if (status === 'paused') await recurringApi.pause(id)
          else if (status === 'active') await recurringApi.resume(id)
          else if (status === 'ended') await recurringApi.end(id)
          else await recurringApi.update(id, { status })
          await refresh(['recurring'])
        } catch (err) {
          patchState({ recurring: prev })
          throw err
        }
      },
      skipRecurring: async (id) => {
        await recurringApi.skip(id)
        await refresh(['recurring', 'dashboard'])
      },
      deleteRecurring: async (id) => {
        await recurringApi.remove(id)
        await refresh(['recurring', 'dashboard'])
      },

      saveTag: async (data) => {
        const payload = { name: data.name, color: data.color }
        if (data.id) await tagsApi.update(data.id, payload)
        else await tagsApi.create(payload)
        await refresh(['tags'])
      },
      deleteTag: async (id) => {
        await tagsApi.remove(id)
        await refresh(['tags'])
      },

      saveBill: async (data) => {
        const payload = {
          title: data.title,
          category: data.category,
          amount: Number(data.amount),
          dueDate: data.due || data.dueDate,
          accountId: data.accountId || null,
          status: data.status || 'unpaid',
        }
        if (data.id) await billsApi.update(data.id, payload)
        else await billsApi.create(payload)
        await refresh(['bills', 'dashboard'])
      },
      toggleBillPaid: async (id) => {
        const bill = bills.find((b) => b.id === id)
        if (bill?.status === 'paid') {
          await billsApi.update(id, { status: 'unpaid' })
          await refresh(['bills', 'dashboard'])
        } else {
          await billsApi.pay(id)
          await refresh(['bills', 'accounts', 'transactions', 'dashboard'])
        }
      },
      deleteBill: async (id) => {
        await billsApi.remove(id)
        await refresh(['bills', 'dashboard'])
      },

      saveSubscription: async (data) => {
        const payload = {
          name: data.name,
          amount: Number(data.amount),
          cycle: String(data.cycle || 'monthly').toLowerCase(),
          nextRenewal: data.nextRenewal,
          status: data.status || 'active',
        }
        if (data.id) await subscriptionsApi.update(data.id, payload)
        else await subscriptionsApi.create(payload)
        await refresh(['subscriptions'])
      },
      setSubscriptionStatus: async (id, status) => {
        const prev = stateRef.current.subscriptions
        patchState({
          subscriptions: prev.map((s) => (s.id === id ? { ...s, status } : s)),
        })
        try {
          if (status === 'paused') await subscriptionsApi.pause(id)
          else await subscriptionsApi.resume(id)
          await refresh(['subscriptions'])
        } catch (err) {
          patchState({ subscriptions: prev })
          throw err
        }
      },
      deleteSubscription: async (id) => {
        await subscriptionsApi.remove(id)
        await refresh(['subscriptions'])
      },

      saveLoan: async (data) => {
        const payload = {
          name: data.name,
          principal: Number(data.principal),
          remaining: Number(data.remaining),
          interestRate: Number(data.rate ?? data.interestRate),
          emi: Number(data.emi),
          nextDue: data.nextDue,
          tenureMonths: Number(data.tenureMonths),
          paidMonths: Number(data.paidMonths || 0),
        }
        if (data.id) await loansApi.update(data.id, payload)
        else await loansApi.create(payload)
        await refresh(['loans', 'dashboard'])
      },
      deleteLoan: async (id) => {
        await loansApi.remove(id)
        await refresh(['loans', 'dashboard'])
      },

      saveInvestment: async (data) => {
        const payload = {
          name: data.name,
          type: data.type,
          invested: Number(data.invested),
          currentValue: Number(data.value ?? data.currentValue),
        }
        if (data.id) await investmentsApi.update(data.id, payload)
        else await investmentsApi.create(payload)
        await refresh(['investments', 'dashboard'])
      },
      deleteInvestment: async (id) => {
        await investmentsApi.remove(id)
        await refresh(['investments', 'dashboard'])
      },

      markNotificationRead: async (id) => {
        await notificationsApi.markRead(id)
        await refresh(['notifications'])
      },
      markAllNotificationsRead: async () => {
        await notificationsApi.markAllRead()
        await refresh(['notifications'])
      },
    }
  }, [
    state,
    loadingKeys,
    error,
    ensureData,
    refresh,
    patchState,
    resolveAccountId,
    resolveCategoryId,
  ])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

export function useEnsureData(keys: DataKey[]) {
  const { ensureData } = useData()
  const key = keys.join(',')
  useEffect(() => {
    if (keys.length) ensureData(keys)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ensureData])
}
