import { StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg'
import { colors } from '@/theme'

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="foGrad" x1="8" y1="4" x2="44" y2="44">
          <Stop stopColor="#1A56DB" />
          <Stop offset="1" stopColor="#0B1220" />
        </LinearGradient>
      </Defs>
      <Rect width="48" height="48" rx="14" fill="url(#foGrad)" />
      <SvgText
        x="24"
        y="31"
        textAnchor="middle"
        fill="#F0F6FF"
        fontSize="18"
        fontWeight="800"
      >
        FO
      </SvgText>
    </Svg>
  )
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <View style={styles.wordmark}>
      <Text style={[styles.finance, light && styles.light]}>Finance</Text>
      <Text style={[styles.os, light && styles.osLight]}>OS</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wordmark: { flexDirection: 'row', alignItems: 'baseline' },
  finance: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  os: { fontSize: 20, fontWeight: '800', color: colors.brand, letterSpacing: -0.5 },
  light: { color: '#F0F6FF' },
  osLight: { color: '#93C5FD' },
})
