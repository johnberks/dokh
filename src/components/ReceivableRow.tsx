import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { CheckIcon, ChevronRightIcon } from '@/components/icons/heroicons';
import { colors, receivableRowMetrics } from '@/theme/tokens';
import { AppText } from './AppText';

type Status = 'received' | 'scheduled' | 'due_today' | 'confirmation_pending';

type CommonProps = {
  day: string;
  month: string;
  origin: string;
  value: string;
  /** Abre o detalhe. Sem destino (Residência), o item não é tocável e não mostra a seta. */
  onPress?: () => void;
  /** Ícone do tipo (plantão, procedimento, atendimento, residência) antes da origem. */
  icon?: ReactNode;
  disabled?: boolean;
  testID?: string;
};

type PendingProps = CommonProps & {
  status: 'confirmation_pending';
  onConfirm: () => void;
  confirming?: boolean;
};

type RegularProps = CommonProps & {
  status: Exclude<Status, 'confirmation_pending'>;
  onConfirm?: never;
  confirming?: never;
};

export type ReceivableRowProps = PendingProps | RegularProps;

/** One dated Receivable projection. The parent owns the derived status and server confirmation. */
export function ReceivableRow(props: ReceivableRowProps) {
  const { t } = useTranslation('finances');
  const { day, month, origin, value, onPress, icon, disabled = false, status, testID } = props;
  const [pressed, setPressed] = useState(false);
  const tappable = onPress !== undefined && !disabled;
  const received = status === 'received';
  const pending = status === 'confirmation_pending';
  const label = received ? t('entryReceived') : pending ? t('entryPending') : t('entryExpected');
  const confirming = pending && props.confirming === true;

  return (
    <View testID={testID} style={styles.row}>
      <View accessible={false} style={styles.date}>
        <AppText variant="heading1" style={[styles.day, received && styles.receivedDay]}>
          {day}
        </AppText>
        <AppText variant="technical" style={styles.month}>
          {month}
        </AppText>
      </View>
      <View accessible={false} style={[styles.timeline, pending && styles.pendingBottom]}>
        <View
          testID={testID ? `${testID}-dot` : undefined}
          style={[
            styles.dot,
            received ? styles.receivedDot : pending ? styles.pendingDot : styles.expectedDot,
          ]}
        />
      </View>
      <View
        style={[
          styles.body,
          pending ? styles.pendingBody : styles.regularBody,
          pressed && styles.bodyPressed,
        ]}
      >
        <Pressable
          accessible
          accessibilityRole={tappable ? 'button' : undefined}
          accessibilityLabel={[day, month, origin, value, label].join(', ')}
          accessibilityState={{ disabled: !tappable }}
          disabled={!tappable}
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          testID={testID ? `${testID}-details` : undefined}
          style={styles.details}
        >
          <View style={styles.detailsContent}>
            <View style={styles.identity}>
              {icon ? <View style={styles.icon}>{icon}</View> : null}
              <AppText variant="heading1" numberOfLines={2} style={styles.origin}>
                {origin}
              </AppText>
              <AppText variant="heading1" numberOfLines={1} style={styles.value}>
                {value}
              </AppText>
            </View>
            <View
              testID={testID ? `${testID}-status` : undefined}
              accessible={false}
              style={[
                styles.status,
                received
                  ? styles.receivedStatus
                  : pending
                    ? styles.pendingStatus
                    : styles.expectedStatus,
              ]}
            >
              {received ? <CheckIcon color={colors.textSecondary} size={12} /> : null}
              <AppText
                variant="heading1"
                style={[
                  styles.statusText,
                  received
                    ? styles.receivedText
                    : pending
                      ? styles.pendingText
                      : styles.expectedText,
                ]}
              >
                {label}
              </AppText>
            </View>
          </View>
          {tappable ? (
            <View testID={testID ? `${testID}-chevron` : undefined}>
              <ChevronRightIcon color={colors.darkTextSecondary} size={18} />
            </View>
          ) : null}
        </Pressable>
        {pending ? (
          <Pressable
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('confirmReceived')}
            accessibilityState={{ disabled: disabled || confirming, busy: confirming }}
            disabled={disabled || confirming}
            onPress={props.onConfirm}
            testID={testID ? `${testID}-confirm` : undefined}
            style={({ pressed }) => [
              styles.confirm,
              pressed && !disabled && !confirming && styles.pressed,
            ]}
          >
            <AppText variant="heading1" style={styles.confirmText}>
              {t('confirmReceived')}
            </AppText>
            <View style={styles.confirmCircle}>
              {confirming ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <CheckIcon color={colors.accent} size={13} />
              )}
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Espaço entre os cards da timeline (a linha acompanha). */
const CARD_GAP = 12;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: receivableRowMetrics.gap, alignItems: 'stretch' },
  date: {
    width: receivableRowMetrics.dateWidth,
    flexShrink: 0,
    alignItems: 'center',
    gap: 2,
    paddingTop: 2,
  },
  day: { fontSize: 22, lineHeight: 22, letterSpacing: -0.66, fontVariant: ['tabular-nums'] },
  receivedDay: { color: colors.receivableReceivedDay },
  month: { fontSize: 9, lineHeight: 13, letterSpacing: 1.26, color: colors.darkTextSecondary },
  timeline: {
    width: receivableRowMetrics.timelineWidth,
    flexShrink: 0,
    backgroundColor: colors.receivableLine,
    position: 'relative',
    marginBottom: CARD_GAP,
  },
  pendingBottom: { marginBottom: CARD_GAP },
  dot: {
    position: 'absolute',
    top: receivableRowMetrics.dotTop,
    left: -4.5,
    width: receivableRowMetrics.dotDiameter,
    height: receivableRowMetrics.dotDiameter,
    borderRadius: receivableRowMetrics.dotDiameter / 2,
    borderWidth: 1.5,
  },
  receivedDot: { backgroundColor: colors.textSecondary, borderColor: 'transparent' },
  expectedDot: { backgroundColor: colors.background, borderColor: colors.darkTextSecondary },
  pendingDot: { backgroundColor: colors.accent, borderColor: 'transparent' },
  body: { flex: 1, minWidth: 0, borderRadius: receivableRowMetrics.bodyRadius, gap: 10 },
  // Cada entrada é um card leve (referências Tabby/GoPay): a superfície diz "toque aqui".
  regularBody: {
    backgroundColor: '#F8F6EF',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.10)',
    paddingVertical: receivableRowMetrics.pendingPaddingVertical,
    paddingLeft: receivableRowMetrics.pendingPaddingHorizontal,
    paddingRight: 12,
    marginBottom: CARD_GAP,
  },
  bodyPressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
  pendingBody: {
    backgroundColor: colors.reviewAttentionBackground,
    borderWidth: 1,
    borderColor: colors.receivablePendingBorder,
    paddingVertical: receivableRowMetrics.pendingPaddingVertical,
    paddingHorizontal: receivableRowMetrics.pendingPaddingHorizontal,
    marginBottom: CARD_GAP,
  },
  pressed: { opacity: 0.75 },
  details: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailsContent: { flex: 1, minWidth: 0, gap: 12 },
  icon: { alignSelf: 'center' },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  origin: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 20, letterSpacing: -0.16 },
  value: { flexShrink: 0, fontSize: 16, lineHeight: 20, fontVariant: ['tabular-nums'] },
  status: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  receivedStatus: { backgroundColor: colors.receivableReceivedFill, borderColor: 'transparent' },
  expectedStatus: { backgroundColor: 'transparent', borderColor: colors.workCardBorder },
  pendingStatus: { backgroundColor: colors.receivablePendingFill, borderColor: 'transparent' },
  statusText: { fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  receivedText: { color: colors.textSecondary },
  expectedText: { color: colors.textMuted },
  pendingText: { color: colors.reviewBronzeText },
  confirm: {
    minHeight: receivableRowMetrics.confirmHitTarget,
    borderTopWidth: 1,
    borderTopColor: colors.receivablePendingDivider,
    paddingTop: 12,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  confirmText: { fontSize: 14, lineHeight: 18 },
  confirmCircle: {
    width: receivableRowMetrics.confirmCircle,
    height: receivableRowMetrics.confirmCircle,
    borderRadius: receivableRowMetrics.confirmCircle / 2,
    backgroundColor: colors.darkBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
