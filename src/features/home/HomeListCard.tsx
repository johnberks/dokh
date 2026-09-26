import ArrowRight from 'lucide-react-native/icons/arrow-right';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { CardLabel } from '@/components/CardLabel';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette, type WorkLocationColorToken, workLocationColors } from '@/theme/tokens';

/**
 * Card de lista da Home (Home 01: "Próximas entradas" e "Próximos trabalhos"): ícone em
 * quadradinho, título do card, bandeja com os itens e o destino completo numa linha inteira.
 */
export function HomeListCard({
  icon,
  iconTone,
  title,
  children,
  action,
  onAction,
  testID,
}: {
  icon: ReactNode;
  iconTone: 'bronze' | 'sage';
  title: string;
  children: ReactNode;
  action: string;
  onAction: () => void;
  testID: string;
}) {
  const type = useBrandTypography();
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <View style={[styles.icon, iconTone === 'bronze' ? styles.iconBronze : styles.iconSage]}>
          {icon}
        </View>
        <CardLabel>{title}</CardLabel>
      </View>
      <View style={styles.tray}>{children}</View>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        testID={`${testID}-action`}
        style={({ pressed }) => [styles.footer, pressed && styles.pressed]}
      >
        <AppText style={[type.heading1, styles.footerText]}>{action}</AppText>
        <View style={styles.arrow}>
          <ArrowRight color={colors.accent} size={15} strokeWidth={1.8} />
        </View>
      </Pressable>
    </View>
  );
}

/** Linha de entrada: barra de cor da origem, data, origem e valor, numa linha só. */
export function HomeEntryRow({
  date,
  origin,
  value,
  color,
  testID,
}: {
  date: string;
  origin: string;
  value: string;
  /** Cor do Local; `null` = Residência (verde estrutura). A cor nunca é a única pista. */
  color: WorkLocationColorToken | null;
  testID?: string;
}) {
  const type = useBrandTypography();
  return (
    <View
      accessible
      accessibilityLabel={`${date}, ${origin}, ${value}`}
      style={styles.row}
      testID={testID}
    >
      <View
        style={[
          styles.rowBar,
          { backgroundColor: color ? workLocationColors[color] : palette.structure },
        ]}
      />
      <AppText variant="technical" style={styles.rowDate}>
        {date}
      </AppText>
      <AppText numberOfLines={1} style={[type.heading1, styles.rowOrigin]}>
        {origin}
      </AppText>
      <AppText numberOfLines={1} style={[type.heading1, styles.rowValue]}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F6EF',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.16)',
    borderRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 12,
    overflow: 'hidden',
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconBronze: { backgroundColor: 'rgba(169,138,84,0.16)' },
  iconSage: { backgroundColor: 'rgba(111,126,103,0.16)' },
  tray: { backgroundColor: 'rgba(16,22,15,0.045)', borderRadius: 16, padding: 6, gap: 6 },
  footer: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,22,15,0.1)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  footerText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FDFCF8',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowBar: { width: 5, height: 28, borderRadius: 3 },
  rowDate: {
    width: 50,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    color: palette.bronzeDeep,
  },
  rowOrigin: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.14,
    color: colors.textPrimary,
  },
  rowValue: {
    flexShrink: 0,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
});
