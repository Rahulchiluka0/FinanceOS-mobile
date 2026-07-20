export type AccountType = 'cash' | 'bank' | 'wallet' | 'credit_card' | 'upi'

export type TxType = 'income' | 'expense' | 'transfer'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  currency: string
  timezone: string
  dateFormat: string
  theme: string
  notificationPrefs?: Record<string, boolean> | null
  createdAt?: string
}

export interface Account {
  id: string
  name: string
  type: AccountType | string
  balance: number
  openingBalance?: number
  color?: string
  currency?: string
  archived?: boolean
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color?: string
  icon?: string
  parentId?: string | null
  archived?: boolean
}

export interface Tag {
  id: string
  name: string
  color?: string
}

export interface Transaction {
  id: string
  title: string
  type: TxType
  amount: number
  date: string
  notes?: string
  favorite?: boolean
  receipt?: boolean
  receiptUrl?: string | null
  accountId: string
  toAccountId?: string | null
  categoryId?: string | null
  account?: string
  toAccount?: string
  category?: string
  tags?: string[]
}

export interface Budget {
  id: string
  categoryId: string
  category?: string
  period: string
  limit: number
  spent: number
  alertAt?: number
}

export interface Goal {
  id: string
  name: string
  target: number
  current: number
  deadline?: string | null
  color?: string
}

export interface Recurring {
  id: string
  title: string
  type: 'income' | 'expense'
  amount: number
  frequency: string
  nextDate: string
  accountId?: string
  categoryId?: string | null
  status: 'active' | 'paused' | 'ended' | string
  account?: string
  category?: string
}

export interface Bill {
  id: string
  title: string
  category: string
  amount: number
  dueDate?: string
  due?: string
  accountId?: string | null
  status: 'paid' | 'unpaid' | string
}

export interface Subscription {
  id: string
  name: string
  amount: number
  cycle: string
  nextRenewal: string
  status: 'active' | 'paused' | string
}

export interface Loan {
  id: string
  name: string
  principal: number
  remaining: number
  interestRate?: number
  rate?: number
  emi: number
  nextDue?: string
  tenureMonths: number
  paidMonths?: number
}

export interface Investment {
  id: string
  name: string
  type: string
  invested: number
  currentValue?: number
  value?: number
}

export interface AppNotification {
  id: string
  title?: string
  message?: string
  body?: string
  type?: string
  read: boolean
  createdAt?: string
}

export interface DashboardData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  netSavings: number
  netWorth: number
  healthScore: number
  savingRate: number
  recentTransactions?: Transaction[]
  budgets?: Budget[]
  goals?: Goal[]
  upcomingBills?: Bill[]
  upcomingRecurring?: Recurring[]
}

export interface CashFlowPoint {
  month: string
  income: number
  expense: number
}

export interface CategorySpend {
  name: string
  value: number
}

export type DataKey =
  | 'accounts'
  | 'transactions'
  | 'categories'
  | 'budgets'
  | 'goals'
  | 'recurring'
  | 'tags'
  | 'bills'
  | 'subscriptions'
  | 'loans'
  | 'investments'
  | 'notifications'
  | 'dashboard'
  | 'cashFlow'
  | 'categorySpend'
