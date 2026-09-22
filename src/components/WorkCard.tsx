import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Check from 'lucide-react-native/icons/check';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  colors,
  shadow,
  type WorkLocationColorToken,
  workCardMetrics,
  workLocationColors,
} from '@/theme/tokens';
import { AppText } from './AppText';

type CommonProps = {
  place: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
};

export type AgendaWorkCardProps = CommonProps & {
  variant: 'agenda';
  locationColor: WorkLocationColorToken;
  time?: string;
  kind: string;
  payment: {
    state: 'received' | 'scheduled' | 'due_today' | 'undated' | 'confirmation_pending';
    label: string;
  };
};

export type FeaturedWorkCardProps = CommonProps & {
  variant: 'featured';
  eyebrow: string;
  temporalLabel: string;
  time?: string;
  kind: string;
  paymentLabel: string;
};

export type RowWorkCardProps = CommonProps & {
  variant: 'row';
  locationColor: WorkLocationColorToken;
  day: string;
  month: string;
  time?: string;
  duration?: string;
  kind?: string;
};

export type WorkCardProps = AgendaWorkCardProps | FeaturedWorkCardProps | RowWorkCardProps;

function ActionArrow({ placement }: { placement: 'agenda' | 'featured' }) {
  return (
    <View
      accessible={false}
      style={[styles.arrow, placement === 'agenda' ? styles.agendaArrow : styles.featuredArrow]}
    >
      <ArrowRight color={colors.accent} size={16} strokeWidth={1.8} />
    </View>
  );
}

/** Three visual placements share one work identity; all strings come from the feature. */
export function WorkCard(props: WorkCardProps) {
  const { place, value, onPress, disabled = false, accessibilityHint, testID } = props;

  if (props.variant === 'agenda') {
    const label = [props.time, props.kind, place, value, props.payment.label]
      .filter(Boolean)
      .join(', ');
    return (
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          styles.card,
          styles.agendaCard,
          shadow.raised,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <View
          testID={testID ? `${testID}-color` : undefined}
          accessible={false}
          style={[
            styles.agendaColorBar,
            { backgroundColor: workLocationColors[props.locationColor] },
          ]}
        />
        <View style={styles.agendaHeader}>
          <View style={styles.agendaTimeLine}>
            {props.time ? (
              <AppText numberOfLines={1} variant="heading1" style={styles.agendaTime}>
                {props.time}
              </AppText>
            ) : null}
            <AppText numberOfLines={1} style={styles.agendaKind}>
              {props.kind}
            </AppText>
          </View>
          <ActionArrow placement="agenda" />
        </View>
        <AppText numberOfLines={2} variant="heading1" style={styles.agendaPlace}>
          {place}
        </AppText>
        <View style={styles.agendaFooter}>
          <AppText numberOfLines={1} variant="heading1" style={styles.agendaValue}>
            {value}
          </AppText>
          <View testID={testID ? `${testID}-status` : undefined} style={styles.statusLine}>
            {props.payment.state === 'received' ? (
              <Check color={colors.textSecondary} size={12} strokeWidth={2} />
            ) : null}
            <AppText
              numberOfLines={1}
              variant={props.payment.state === 'received' ? 'heading1' : 'body'}
              style={[
                styles.agendaStatus,
                props.payment.state === 'received' && styles.receivedStatus,
              ]}
            >
              {props.payment.label}
            </AppText>
          </View>
        </View>
      </Pressable>
    );
  }

  if (props.variant === 'featured') {
    const label = [
      props.eyebrow,
      props.temporalLabel,
      props.time,
      place,
      props.kind,
      value,
      props.paymentLabel,
    ]
      .filter(Boolean)
      .join(', ');
    return (
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          styles.card,
          styles.featuredCard,
          shadow.raised,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.featuredHeader}>
          <AppText numberOfLines={1} variant="technical" style={styles.eyebrow}>
            {props.eyebrow}
          </AppText>
          <ActionArrow placement="featured" />
        </View>
        <View style={styles.featuredTimeLine}>
          <AppText numberOfLines={1} variant="technical" style={styles.temporalLabel}>
            {props.temporalLabel}
          </AppText>
          {props.time ? (
            <AppText numberOfLines={1} variant="heading1" style={styles.featuredTime}>
              {props.time}
            </AppText>
          ) : null}
        </View>
        <View style={styles.featuredIdentity}>
          <AppText numberOfLines={2} variant="heading1" style={styles.featuredPlace}>
            {place}
          </AppText>
          <AppText numberOfLines={1} style={styles.featuredKind}>
            {props.kind}
          </AppText>
        </View>
        <View style={styles.featuredFooter}>
          <AppText numberOfLines={1} variant="heading1" style={styles.featuredValue}>
            {value}
          </AppText>
          <AppText numberOfLines={2} style={styles.featuredPayment}>
            {props.paymentLabel}
          </AppText>
        </View>
      </Pressable>
    );
  }

  const detail = [props.time, props.duration ?? props.kind].filter(Boolean).join(' · ');
  const label = [props.day, props.month, place, props.kind, props.time, props.duration, value]
    .filter(Boolean)
    .join(', ');
  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.rowCard,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        testID={testID ? `${testID}-color` : undefined}
        accessible={false}
        style={[styles.rowColorBar, { backgroundColor: workLocationColors[props.locationColor] }]}
      />
      <View style={styles.rowDate}>
        <AppText variant="heading1" style={styles.rowDay}>
          {props.day}
        </AppText>
        <AppText variant="technical" style={styles.rowMonth}>
          {props.month}
        </AppText>
      </View>
      <View style={styles.rowIdentity}>
        <AppText numberOfLines={1} variant="heading1" style={styles.rowPlace}>
          {place}
        </AppText>
        {detail ? (
          <AppText numberOfLines={1} style={styles.rowDetail}>
            {detail}
          </AppText>
        ) : null}
      </View>
      <AppText numberOfLines={1} variant="heading1" style={styles.rowValue}>
        {value}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.workCardBorder,
    borderRadius: workCardMetrics.radius,
  },
  pressed: { transform: [{ translateY: 1 }] },
  disabled: { opacity: 0.48 },
  arrow: {
    borderRadius: 999,
    backgroundColor: colors.darkBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendaArrow: {
    width: workCardMetrics.agendaArrow,
    height: workCardMetrics.agendaArrow,
    marginTop: -4,
    marginRight: -4,
  },
  featuredArrow: {
    width: workCardMetrics.featuredArrow,
    height: workCardMetrics.featuredArrow,
    marginTop: -6,
    marginRight: -4,
  },
  agendaCard: {
    paddingTop: workCardMetrics.agendaPaddingTop,
    paddingRight: workCardMetrics.agendaPaddingRight,
    paddingBottom: workCardMetrics.agendaPaddingBottom,
    paddingLeft: workCardMetrics.agendaPaddingLeft,
    gap: 12,
  },
  agendaColorBar: {
    position: 'absolute',
    top: workCardMetrics.agendaBarInset,
    bottom: workCardMetrics.agendaBarInset,
    left: 0,
    width: workCardMetrics.agendaBarWidth,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  agendaTimeLine: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  agendaTime: { fontSize: 28, lineHeight: 28, letterSpacing: -0.84 },
  agendaKind: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    paddingBottom: 3,
  },
  agendaPlace: { fontSize: 18, lineHeight: 22, letterSpacing: -0.18 },
  agendaFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.workCardDivider,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  agendaValue: { fontSize: 16, lineHeight: 20 },
  statusLine: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  agendaStatus: { flexShrink: 1, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  receivedStatus: { color: colors.textSecondary },
  featuredCard: {
    paddingTop: workCardMetrics.featuredPaddingTop,
    paddingHorizontal: workCardMetrics.featuredPaddingHorizontal,
    paddingBottom: workCardMetrics.featuredPaddingBottom,
    gap: 18,
  },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.8,
    color: colors.darkTextSecondary,
  },
  featuredTimeLine: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  temporalLabel: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.32,
    color: colors.accent,
    paddingBottom: 6,
  },
  featuredTime: { fontSize: 40, lineHeight: 40, letterSpacing: -1.6 },
  featuredIdentity: { gap: 3 },
  featuredPlace: { fontSize: 19, lineHeight: 23, letterSpacing: -0.19 },
  featuredKind: { fontSize: 14, lineHeight: 19, color: colors.textMuted },
  featuredFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.workCardDivider,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  featuredValue: { fontSize: 18, lineHeight: 22 },
  featuredPayment: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: 'right',
  },
  rowCard: {
    minHeight: 44,
    backgroundColor: colors.workRowSurface,
    borderWidth: 1,
    borderColor: colors.workCardDivider,
    borderRadius: workCardMetrics.rowRadius,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowColorBar: {
    width: workCardMetrics.rowBarWidth,
    height: workCardMetrics.rowBarHeight,
    borderRadius: 3,
  },
  rowDate: { width: workCardMetrics.rowDateWidth, alignItems: 'center' },
  rowDay: { fontSize: 17, lineHeight: 19, letterSpacing: -0.34 },
  rowMonth: { fontSize: 8, lineHeight: 12, letterSpacing: 1.12, color: colors.darkTextSecondary },
  rowIdentity: { flex: 1, minWidth: 0, gap: 1 },
  rowPlace: { fontSize: 14, lineHeight: 17, letterSpacing: -0.14 },
  rowDetail: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  rowValue: { fontSize: 14, lineHeight: 18 },
});
