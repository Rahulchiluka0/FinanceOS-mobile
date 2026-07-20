import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { dataApi, jobsApi } from '@/api'
import { useData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'

export default function ImportExportScreen() {
  const { refreshAll } = useData()
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [parsedRows, setParsedRows] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const shareFile = async (filename: string, contents: string, mimeType: string) => {
    const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory
    if (!dir) throw new Error('No writable directory available')
    const uri = `${dir}${filename}`
    await FileSystem.writeAsStringAsync(uri, contents)
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType, dialogTitle: filename })
    } else {
      Alert.alert('Saved', `File written to ${uri}`)
    }
  }

  const pickImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: format === 'json' ? ['application/json', 'text/json'] : ['text/csv', 'text/comma-separated-values', 'text/plain'],
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets?.[0]) return
      const asset = result.assets[0]
      const text = await FileSystem.readAsStringAsync(asset.uri)
      if (format === 'json') {
        const data = JSON.parse(text)
        const rows = Array.isArray(data) ? data : data.transactions || []
        setParsedRows(rows)
        setPreview(rows.slice(0, 10))
        showToast(`Parsed ${rows.length} transactions from ${asset.name}`)
      } else {
        const lines = text.split(/\r?\n/).filter(Boolean)
        const headers = (lines[0] || '').split(',').map((h) => h.trim())
        const rows = lines.slice(1).map((line) => {
          const vals = line.split(',')
          return headers.reduce(
            (obj, h, i) => ({ ...obj, [h]: vals[i]?.trim() }),
            {} as Record<string, string>,
          )
        })
        setParsedRows({ __csv: text, count: rows.length })
        setPreview(rows.slice(0, 10))
        showToast(`Parsed ${rows.length} CSV rows from ${asset.name}`)
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to read file')
    }
  }

  const runImport = async () => {
    setBusy(true)
    try {
      let result: any
      if (format === 'json') {
        if (!Array.isArray(parsedRows) || !parsedRows.length) {
          showToast('Load a JSON file first')
          return
        }
        result = await dataApi.importTransactions({ format: 'json', transactions: parsedRows })
      } else {
        const csv = parsedRows?.__csv
        if (!csv) {
          showToast('Load a CSV file first')
          return
        }
        result = await dataApi.importTransactions({ format: 'csv', csv })
      }
      await refreshAll?.()
      await successTap()
      showToast(`Imported ${result.imported} · failed ${result.failed}`)
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  const exportTransactions = async () => {
    setBusy(true)
    try {
      const csv = await dataApi.exportCsv()
      await shareFile('transactions.csv', csv, 'text/csv')
      await successTap()
      showToast('Transactions exported')
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  const backup = async () => {
    setBusy(true)
    try {
      const payload = await dataApi.backup()
      await shareFile('financeos-backup.json', JSON.stringify(payload, null, 2), 'application/json')
      await successTap()
      showToast('Full backup ready to share')
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Backup failed')
    } finally {
      setBusy(false)
    }
  }

  const restore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json'],
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets?.[0]) return
      setBusy(true)
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri)
      const backupData = JSON.parse(text)
      const res = (await dataApi.restore(backupData)) as any
      await refreshAll?.()
      await successTap()
      showToast(`Restored ${res.imported} transactions · failed ${res.failed}`)
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Restore failed')
    } finally {
      setBusy(false)
    }
  }

  const runJobs = async () => {
    setBusy(true)
    try {
      const result = (await jobsApi.run()) as any
      if (result.skipped) {
        showToast('Jobs skipped — another run is in progress')
      } else {
        showToast(
          `Jobs done · recurring ${result.recurring?.created ?? 0} · notifications ${result.notifications?.created ?? 0}`,
        )
      }
      await refreshAll?.()
      await successTap()
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Jobs failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <PageHead
        kicker="Data"
        title="Import / Export"
        subtitle="Move data in and out of FinanceOS."
      />
      {toast ? <Text style={styles.toast}>{toast}</Text> : null}

      <View style={styles.panel}>
        <Text style={styles.h2}>Import</Text>
        <View style={styles.chips}>
          {(['csv', 'json'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => {
                setFormat(f)
                setPreview([])
                setParsedRows(null)
              }}
              style={[styles.chip, format === f && styles.chipActive]}
            >
              <Text style={[styles.chipText, format === f && styles.chipTextActive]}>
                {f.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.meta}>
          CSV headers: title, type, amount, date, account, category, notes, tags
        </Text>
        <Button variant="secondary" onPress={pickImportFile} disabled={busy}>
          Choose {format.toUpperCase()} file
        </Button>
        <Button loading={busy} onPress={runImport}>
          Import into FinanceOS
        </Button>
        {preview.length > 0 ? (
          <View style={{ gap: 6 }}>
            <Badge tone="info">{preview.length} rows preview</Badge>
            {preview.slice(0, 5).map((row, i) => (
              <Text key={i} style={styles.preview} numberOfLines={2}>
                {Object.values(row).join(' · ')}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.h2}>Export</Text>
        <Button variant="secondary" loading={busy} onPress={exportTransactions}>
          Export transactions (CSV)
        </Button>
        <Button variant="secondary" loading={busy} onPress={backup}>
          Export full backup (JSON)
        </Button>
      </View>

      <View style={styles.panel}>
        <Text style={styles.h2}>Backup, restore & jobs</Text>
        <Text style={styles.meta}>
          Backup downloads a server snapshot. Restore re-imports from a backup file. Jobs create due
          recurring transactions and reminders.
        </Text>
        <Button loading={busy} onPress={backup}>
          Backup everything
        </Button>
        <Button variant="secondary" loading={busy} onPress={restore}>
          Restore from file
        </Button>
        <Button variant="ghost" loading={busy} onPress={runJobs}>
          Run jobs now
        </Button>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  toast: {
    backgroundColor: colors.brandSoft,
    color: colors.brand,
    fontWeight: '700',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    marginBottom: 14,
  },
  h2: { fontSize: 16, fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted, fontSize: 13 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  chipTextActive: { color: colors.brand },
  preview: { fontSize: 12, color: colors.inkSoft },
})
