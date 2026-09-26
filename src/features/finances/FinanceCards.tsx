import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import Stethoscope from 'lucide-react-native/icons/stethoscope';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { PremiumBadge } from '@/components/PremiumBadge';
import { WorkTypeIcon, workTypeTone } from '@/components/WorkTypeIcon';
import { formatCentsToBRL } from '@/domain/money';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { InfoButton, type InfoRequest } from './FinanceInfo';
import type { EntryOrigin, FinanceMonth } from './finance-data';
import { hourlyReais, hoursLabel } from './finance-format';

const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });

/**
 * "Seu trabalho em setembro" (Finanças 01 e 02): trabalho gerado, quantidade, horas e
 * valor/hora. Usado no mês e na análise completa de valor/hora.
 */
export function WorkGeneratedCard({
  data,
  name,
  isPremium,
  onInfo,
}: {
  data: FinanceMonth;
  name: string;
  isPremium: boolean;
  onInfo: (request: InfoRequest) => void;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  return (
    <SectionCard
      icon={<Stethoscope color={colors.textPrimary} size={16} strokeWidth={1.7} />}
      eyebrow={t('work.eyebrow', { month: name.toUpperCase() })}
      testID="finances-work"
    >
      <View style={styles.generatedRow}>
        <AppText style={[type.heading1, styles.generatedValue]}>
          {money(data.workGeneratedCents)}
        </AppText>
        <AppText style={styles.generatedLabel}>{t('work.generated')}</AppText>
        <InfoButton
          label={t('info.generated.title')}
          onPress={() => onInfo({ key: 'generated', value: money(data.workGeneratedCents) })}
          testID="finances-info-generated"
        />
      </View>
      <View style={styles.metrics}>
        <Metric
          value={String(data.workCount)}
          label={data.workCount === 1 ? t('work.worksOne') : t('work.worksMany')}
        />
        {data.workDurationMinutes > 0 && (
          <>
            <AppText style={styles.metricArrow}>{'→'}</AppText>
            <Metric value={hoursLabel(data.workDurationMinutes)} label={t('work.hours')} />
          </>
        )}
        {data.workDurationMinutes > 0 && (
          <>
            <AppText style={styles.metricArrow}>{'→'}</AppText>
            <View style={styles.metricWide} testID="finances-hourly">
              {isPremium && data.hourlyValueCents !== null ? (
                <AppText
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[type.heading1, styles.metricValue]}
                  testID="finances-hourly-value"
                >
                  {hourlyReais(data.hourlyValueCents)}
                  <AppText style={styles.metricUnit}>{t('work.perHour')}</AppText>
                </AppText>
              ) : (
                <AppText
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[type.heading1, styles.metricValue, styles.maskedValue]}
                >
                  {'R$ •••'}
                  <AppText style={styles.metricUnit}>{t('work.perHour')}</AppText>
                </AppText>
              )}
              <View style={styles.hourlyLabelRow}>
                {isPremium ? (
                  <AppText style={styles.metricLabel}>{t('work.hourly')}</AppText>
                ) : (
                  <PremiumBadge size="short" />
                )}
                <InfoButton
                  label={t('info.hourly.title')}
                  onPress={() =>
                    onInfo({
                      key: 'hourly',
                      value:
                        isPremium && data.hourlyValueCents !== null
                          ? `${hourlyReais(data.hourlyValueCents)}${t('work.perHour')}`
                          : `R$ •••${t('work.perHour')}`,
                      example:
                        isPremium && data.hourlyValueCents !== null
                          ? t('info.hourlyExample', {
                              generated: money(data.workGeneratedCents),
                              hours: hoursLabel(data.workDurationMinutes),
                              hourly: hourlyReais(data.hourlyValueCents),
                            })
                          : undefined,
                    })
                  }
                  testID="finances-info-hourly"
                />
              </View>
            </View>
          </>
        )}
      </View>
    </SectionCard>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  const type = useBrandTypography();
  return (
    <View style={styles.metric}>
      <AppText adjustsFontSizeToFit numberOfLines={1} style={[type.heading1, styles.metricValue]}>
        {value}
      </AppText>
      <AppText numberOfLines={1} style={styles.metricLabel}>
        {label}
      </AppText>
    </View>
  );
}

/** Card de seção do HTML: ícone em quadrado, rótulo técnico e, no Free, o selo Premium. */
export function SectionCard({
  icon,
  eyebrow,
  title,
  premiumBadge = false,
  children,
  testID,
}: {
  icon: ReactNode;
  eyebrow: string;
  /** Título da seção fora do card (teste do usuário na visão anual); substitui o rótulo interno. */
  title?: string;
  premiumBadge?: boolean;
  children: ReactNode;
  testID?: string;
}) {
  const badge = premiumBadge ? (
    <PremiumBadge testID={testID ? `${testID}-premium` : undefined} />
  ) : null;
  if (title) {
    return (
      <View style={styles.section} testID={testID}>
        <SectionTitle title={title} right={badge} />
        <View style={styles.card}>{children}</View>
      </View>
    );
  }
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitle}>
          {icon ? <View style={styles.sectionIcon}>{icon}</View> : null}
          <AppText variant="technical" style={styles.eyebrow}>
            {eyebrow}
          </AppText>
        </View>
        {badge}
      </View>
      {children}
    </View>
  );
}

/**
 * Título de seção fora do card (referência do usuário): texto de seção à esquerda e, à direita,
 * o selo ou o `i`. `light` para quando o título fica sobre o topo verde.
 */
export function SectionTitle({
  title,
  right,
  tone = 'dark',
  testID,
}: {
  title: string;
  right?: ReactNode;
  tone?: 'dark' | 'light';
  testID?: string;
}) {
  const type = useBrandTypography();
  return (
    <View style={styles.titleRow} testID={testID}>
      <AppText
        accessibilityRole="header"
        numberOfLines={1}
        style={[type.heading1, styles.titleText, tone === 'light' && styles.titleLight]}
      >
        {title}
      </AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
  },
  // heading1 traz letterSpacing -1.02: em 18 pt as letras grudariam.
  titleText: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.27,
    color: colors.textPrimary,
  },
  titleLight: { color: palette.cream },
  card: {
    backgroundColor: '#F8F6EF',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.16)',
    borderRadius: 22,
    padding: 18,
    gap: 14,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(16,22,15,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatedRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  generatedValue: { fontSize: 22, lineHeight: 26, letterSpacing: -0.66, color: colors.textPrimary },
  generatedLabel: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  metrics: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16,22,15,0.045)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  metric: { flex: 1, gap: 4 },
  metricWide: { flex: 1.5, gap: 6 },
  metricArrow: { fontSize: 14, lineHeight: 24, color: palette.sage, paddingHorizontal: 6 },
  metricValue: { fontSize: 22, lineHeight: 26, letterSpacing: -0.66, color: colors.textPrimary },
  maskedValue: { color: 'rgba(16,22,15,0.35)' },
  metricUnit: { fontSize: 14, color: palette.sage },
  metricLabel: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  hourlyLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
});

/** Ícone do tipo em quadradinho com o tom do seletor de tipo; Residência em sálvia. */
export function OriginTile({ origin }: { origin: EntryOrigin }) {
  return (
    <View
      style={[
        cardStyles.tile,
        {
          backgroundColor:
            origin === 'residency' ? colors.workTypeShiftTile : workTypeTone[origin].tile,
        },
      ]}
    >
      {origin === 'residency' ? (
        <GraduationCap color={palette.workSage} size={16} strokeWidth={1.8} />
      ) : (
        <WorkTypeIcon type={origin} size={16} />
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  tile: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
