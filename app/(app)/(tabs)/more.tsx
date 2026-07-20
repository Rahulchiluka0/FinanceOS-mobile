import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import {
  Tags,
  PiggyBank,
  Target,
  Repeat,
  Receipt,
  CalendarDays,
  Landmark,
  LineChart,
  RefreshCw,
  Coins,
  BarChart3,
  Lightbulb,
  Brain,
  Activity,
  Tag,
  Search,
  Bell,
  FileUp,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { BrandMark, Wordmark } from '@/components/brand/BrandMark'
import { initials } from '@/utils/format'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

const sections = [
  {
    label: 'Main',
    items: [
      { href: '/(app)/categories', label: 'Categories', icon: Tags },
      { href: '/(app)/budgets', label: 'Budgets', icon: PiggyBank },
      { href: '/(app)/goals', label: 'Savings Goals', icon: Target },
      { href: '/(app)/recurring', label: 'Recurring', icon: Repeat },
      { href: '/(app)/bills', label: 'Bills', icon: Receipt },
      { href: '/(app)/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Grow',
    items: [
      { href: '/(app)/loans', label: 'Loans & EMI', icon: Landmark },
      { href: '/(app)/investments', label: 'Investments', icon: LineChart },
      { href: '/(app)/subscriptions', label: 'Subscriptions', icon: RefreshCw },
      { href: '/(app)/currencies', label: 'Multi-Currency', icon: Coins },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/(app)/reports', label: 'Reports', icon: BarChart3 },
      { href: '/(app)/insights', label: 'Smart Insights', icon: Lightbulb },
      { href: '/(app)/ai-cfo', label: 'Personal CFO', icon: Brain },
      { href: '/(app)/ai-health', label: 'Financial Health', icon: Activity },
      { href: '/(app)/tags', label: 'Tags', icon: Tag },
      { href: '/(app)/search', label: 'Search', icon: Search },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/(app)/notifications', label: 'Notifications', icon: Bell, badge: true },
      { href: '/(app)/import-export', label: 'Import / Export', icon: FileUp },
      { href: '/(app)/settings', label: 'Settings', icon: Settings },
    ],
  },
] as const

export default function MoreScreen() {
  const { user, logout } = useAuth()
  const { unreadCount } = useData()

  return (
    <Screen>
      <View style={styles.brand}>
        <BrandMark size={36} />
        <Wordmark />
      </View>

      <View style={styles.userChip}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {sections.map((section) => (
        <View key={section.label} style={styles.section}>
          <Text style={styles.sectionLabel}>{section.label}</Text>
          <View style={styles.card}>
            {section.items.map((item, idx) => {
              const Icon = item.icon
              return (
                <Pressable
                  key={item.href}
                  onPress={() => {
                    lightTap()
                    router.push(item.href as any)
                  }}
                  style={[styles.row, idx < section.items.length - 1 && styles.rowBorder]}
                >
                  <View style={styles.iconWrap}>
                    <Icon size={18} color={colors.brand} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  {'badge' in item && item.badge && unreadCount > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                  ) : null}
                  <ChevronRight size={18} color={colors.muted} />
                </Pressable>
              )
            })}
          </View>
        </View>
      ))}

      <Pressable
        style={styles.logout}
        onPress={() => {
          logout()
          router.replace('/(auth)/login')
        }}
      >
        <LogOut size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.brand, fontWeight: '800' },
  userName: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  userEmail: { color: colors.muted, fontSize: 13 },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
})
