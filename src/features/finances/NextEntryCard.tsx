import Check from 'lucide-react-native/icons/check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { formatCentsToBRL } from '@/domain/money';
import { useConfirmReceivable } from '@/features/work/work-data';
import { localDateToDate } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { OriginTile } from './FinanceCards';
import type { NextEntry, UpcomingEntry } from './finance-data';
import { relativeDay } from './finance-format';

const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });
const LONG_DATE = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});
const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Próxima entrada (Finanças 01), com referências da Mobbin (Kit, Gusto, Quicken): o tempo que
 * falta é a manchete, o valor vem em destaque com a origem igual à de Entradas, a etiqueta diz o
 * status e a ação ocupa a linha inteira. No dia previsto, `Você recebeu?` confirma ali mesmo —
 * só pelo servidor, nunca pela passagem do tempo. No mês atual, até duas entradas seguintes.
 */
export function NextEntryCard({
  entry,
  today,
  showFollowing,
  onOpen,
}: {
  entry: NextEntry;
  today: string;
  /** Prévia do que vem depois: só no mês atual. */
  showFollowing: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const confirm = useConfirmReceivable();
  const [failed, setFailed] = useState(false);
  const isToday = entry.expectedOn <= today;
  const origin = originName(entry, t('next.residency'));
  const headline = capitalized(relativeDay(entry.expectedOn, today, t));
  const date = LONG_DATE.format(localDateToDate(entry.expectedOn));
  const following = showFollowing ? entry.following : [];
  const more = showFollowing ? entry.moreCount : 0;

  return (
    <View style={styles.card} testID="finances-next">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('next.eyebrow')}: ${headline}, ${date}, ${origin}, ${money(entry.amountCents)}. ${t('next.seeEntries')}`}
        onPress={onOpen}
        testID="finances-next-open"
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={styles.header}>
          <AppText variant="technical" style={styles.eyebrow}>
            {t('next.eyebrow')}
          </AppText>
          <View
            style={[styles.tag, isToday ? styles.tagToday : styles.tagExpected]}
            testID="finances-next-tag"
          >
            <AppText style={[type.heading1, styles.tagText, isToday && styles.tagTextToday]}>
              {isToday ? t('next.tagToday') : t('next.tagExpected')}
            </AppText>
          </View>
        </View>

        <View style={styles.when}>
          <AppText style={[type.heading1, styles.headline]} testID="finances-next-when">
            {headline}
          </AppText>
          <AppText style={styles.date}>{date}</AppText>
        </View>

        <View style={styles.originRow}>
          <OriginTile origin={entry.origin} />
          <AppText numberOfLines={1} style={[type.heading1, styles.originName]}>
            {origin}
          </AppText>
          <AppText
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[type.heading1, styles.value]}
            testID="finances-next-value"
          >
            {money(entry.amountCents)}
          </AppText>
        </View>

        {following.length > 0 ? (
          <View style={styles.following} testID="finances-next-following">
            {following.map((item) => (
              <FollowingRow key={item.receivableId} item={item} today={today} />
            ))}
            {more > 0 ? (
              <AppText style={styles.more}>
                {more === 1 ? t('next.moreOne') : t('next.moreMany', { count: more })}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </Pressable>

      {isToday ? (
        <View style={styles.confirmBlock}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('confirmReceived')}
            accessibilityState={{ busy: confirm.isPending, disabled: confirm.isPending }}
            disabled={confirm.isPending}
            onPress={() => {
              setFailed(false);
              confirm.mutate(entry.receivableId, { onError: () => setFailed(true) });
            }}
            testID="finances-next-confirm"
            style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.confirmText]}>{t('confirmReceived')}</AppText>
            <View style={styles.confirmCircle}>
              {confirm.isPending ? (
                <ActivityIndicator color={palette.bronze} size="small" />
              ) : (
                <Check color={palette.bronze} size={14} strokeWidth={2.2} />
              )}
            </View>
          </Pressable>
          {failed ? (
            <AppText accessibilityRole="alert" style={styles.error}>
              {t('entries.confirmError')}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        testID="finances-next-see-entries"
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
      >
        <AppText style={[type.heading1, styles.ctaText]}>{t('next.seeEntries')}</AppText>
        <ChevronRight color={palette.bronze} size={18} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function FollowingRow({ item, today }: { item: UpcomingEntry; today: string }) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  return (
    <View style={styles.followingRow}>
      <AppText numberOfLines={1} style={styles.followingText}>
        <AppText style={styles.followingWhen}>{relativeDay(item.expectedOn, today, t)}</AppText>
        {` · ${originName(item, t('next.residency'))}`}
      </AppText>
      <AppText style={[type.heading1, styles.followingValue]}>{money(item.amountCents)}</AppText>
    </View>
  );
}

function originName(item: UpcomingEntry, residency: string): string {
  return item.origin === 'residency' ? residency : (item.locationName ?? residency);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F6EF',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.16)',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  main: { paddingTop: 18, paddingHorizontal: 18, paddingBottom: 16, gap: 14 },
  pressed: { opacity: 0.8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  tag: { borderRadius: 999, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10 },
  tagExpected: { borderColor: 'rgba(16,22,15,0.16)' },
  tagToday: { borderColor: 'transparent', backgroundColor: 'rgba(169,138,84,0.18)' },
  tagText: { fontSize: 12, lineHeight: 16, letterSpacing: 0, color: palette.mutedCopy },
  tagTextToday: { color: palette.bronzeDeep },
  when: { gap: 2 },
  headline: { fontSize: 30, lineHeight: 34, letterSpacing: -0.9, color: colors.textPrimary },
  date: { fontSize: 13, lineHeight: 18, color: palette.mutedCopy },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,22,15,0.08)',
    paddingTop: 14,
  },
  originName: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: colors.textPrimary,
  },
  value: {
    flexShrink: 0,
    maxWidth: '50%',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.44,
    color: colors.textPrimary,
  },
  following: {
    gap: 8,
    backgroundColor: 'rgba(16,22,15,0.045)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  followingRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  followingText: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 18, color: palette.mutedCopy },
  followingWhen: { fontSize: 13, color: colors.textPrimary },
  followingValue: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  more: { fontSize: 12, lineHeight: 16, color: palette.sage },
  confirmBlock: { paddingHorizontal: 18, paddingBottom: 14, gap: 8 },
  confirm: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: colors.reviewAttentionBackground,
    borderWidth: 1,
    borderColor: colors.receivablePendingBorder,
  },
  confirmText: { fontSize: 15, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  confirmCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontSize: 13, lineHeight: 18, color: palette.bronzeDeep },
  cta: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,22,15,0.08)',
    paddingHorizontal: 18,
  },
  ctaText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
});
