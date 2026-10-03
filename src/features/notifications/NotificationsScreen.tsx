import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { LoadError } from '@/components/TechnicalStates';
import {
  ChoiceChips,
  InsetList,
  Note,
  SectionTitle,
  SubScreen,
} from '@/features/profile/ProfilePieces';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { useNotificationPermission } from './notification-permission';
import {
  type NotificationPreferences,
  RECEIVABLE_TIMES,
  useNotificationPreferences,
  useSaveNotificationPreferences,
  WORK_REMINDER_LEADS,
} from './notification-preferences';

/**
 * Perfil 14: dois grupos (Entradas, Agenda) com toggles e subtexto, ligados por padrão. Quando
 * ligado, a personalização aparece logo abaixo (horário do aviso, antecedência), como nos
 * ajustes de Craft e Tiimo (Mobbin). A permissão do sistema aparece à parte: negar no iPhone não
 * desliga nenhuma escolha daqui (D52). Cada mudança é gravada na hora.
 */
export function NotificationsScreen() {
  const { t } = useTranslation('notifications');
  const preferences = useNotificationPreferences();
  if (preferences.data) return <NotificationsForm initial={preferences.data} />;
  return (
    <SubScreen title={t('screen.title')} onBack={() => router.back()}>
      {preferences.isError ? (
        <LoadError onRetry={() => void preferences.refetch()} retrying={preferences.isFetching} />
      ) : (
        <ActivityIndicator color={palette.sage} style={styles.loading} />
      )}
    </SubScreen>
  );
}

function NotificationsForm({ initial }: { initial: NotificationPreferences }) {
  const { t } = useTranslation('notifications');
  const save = useSaveNotificationPreferences();
  const [value, setValue] = useState(initial);
  const [failed, setFailed] = useState(false);
  const saved = useRef(initial);

  function change(patch: Partial<NotificationPreferences>) {
    const next = { ...value, ...patch };
    setValue(next);
    setFailed(false);
    save.mutate(next, {
      onSuccess: () => {
        saved.current = next;
      },
      // Falhou: a tela volta ao que está gravado e avisa.
      onError: () => {
        setValue(saved.current);
        setFailed(true);
      },
    });
  }

  const leadLabel = (lead: number) => t(`screen.leads.min${lead}` as 'screen.leads.min120');

  return (
    <SubScreen title={t('screen.title')} onBack={() => router.back()} testID="notifications-screen">
      <SystemPermission />

      <View style={styles.section}>
        <SectionTitle>{t('screen.receivablesGroup')}</SectionTitle>
        <InsetList grouped>
          <ToggleRow
            label={t('screen.dueDay')}
            subtitle={`${t('screen.dueDaySub')} · ${value.receivableDueTime.replace(':00', 'h')}`}
            value={value.receivableDueDay}
            onChange={(receivableDueDay) => change({ receivableDueDay })}
            testID="notifications-due-day"
          />
          {value.receivableDueDay && (
            <View style={[styles.detail, styles.divider]} testID="notifications-due-time">
              <AppText style={styles.detailLabel}>{t('screen.dueTime')}</AppText>
              <ChoiceChips
                label={t('screen.dueTime')}
                options={RECEIVABLE_TIMES.map((time) => ({
                  value: time,
                  label: time.replace(':00', 'h'),
                }))}
                value={value.receivableDueTime}
                onChange={(receivableDueTime) => change({ receivableDueTime })}
                testID="notifications-due-time-option"
              />
            </View>
          )}
          <ToggleRow
            label={t('screen.undated')}
            subtitle={t('screen.undatedSub')}
            value={value.undatedWeeklyReminder}
            onChange={(undatedWeeklyReminder) => change({ undatedWeeklyReminder })}
            last
            testID="notifications-undated"
          />
        </InsetList>
      </View>

      <View style={styles.section}>
        <SectionTitle>{t('screen.agendaGroup')}</SectionTitle>
        <InsetList grouped>
          <ToggleRow
            label={t('screen.upcomingWork')}
            subtitle={`${leadLabel(value.workReminderMinutes)} · ${t('screen.upcomingWorkSub').toLowerCase()}`}
            value={value.upcomingWorkReminder}
            onChange={(upcomingWorkReminder) => change({ upcomingWorkReminder })}
            last={!value.upcomingWorkReminder}
            testID="notifications-upcoming-work"
          />
          {value.upcomingWorkReminder && (
            <View style={styles.detail} testID="notifications-lead">
              <AppText style={styles.detailLabel}>{t('screen.lead')}</AppText>
              <ChoiceChips
                label={t('screen.lead')}
                options={WORK_REMINDER_LEADS.map((lead) => ({
                  value: lead,
                  label: leadLabel(lead),
                }))}
                value={value.workReminderMinutes}
                onChange={(workReminderMinutes) => change({ workReminderMinutes })}
                testID="notifications-lead-option"
              />
              <AppText style={styles.detailNote}>{t('screen.leadNote')}</AppText>
            </View>
          )}
        </InsetList>
      </View>

      {failed && (
        <AppText accessibilityLiveRegion="polite" style={styles.error} testID="notifications-error">
          {t('screen.saveError')}
        </AppText>
      )}
      <View style={styles.section}>
        <Note>{t('screen.localNote')}</Note>
      </View>
    </SubScreen>
  );
}

/** Permissão do sistema, à parte das escolhas: negada leva aos Ajustes; não pedida, pede. */
function SystemPermission() {
  const { t } = useTranslation('notifications');
  const type = useBrandTypography();
  const permission = useNotificationPermission((store) => store.state);

  useEffect(() => {
    void useNotificationPermission.getState().refresh();
  }, []);

  if (permission !== 'denied' && permission !== 'undetermined') return null;
  const denied = permission === 'denied';
  return (
    <View style={styles.system} testID={`notifications-system-${permission}`}>
      <AppText style={[type.heading1, styles.systemTitle]}>
        {denied ? t('screen.system.deniedTitle') : t('screen.system.undeterminedTitle')}
      </AppText>
      <AppText style={styles.systemText}>
        {denied ? t('screen.system.deniedText') : t('screen.system.undeterminedText')}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={denied ? t('screen.system.openSettings') : t('screen.system.allow')}
        onPress={() => {
          if (denied) void Linking.openSettings();
          else void useNotificationPermission.getState().request();
        }}
        testID="notifications-system-action"
        style={({ pressed }) => [styles.systemButton, pressed && styles.pressed]}
      >
        <AppText style={[type.heading1, styles.systemButtonText]}>
          {denied ? t('screen.system.openSettings') : t('screen.system.allow')}
        </AppText>
      </Pressable>
    </View>
  );
}

function ToggleRow({
  label,
  subtitle,
  value,
  onChange,
  last = false,
  testID,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
  testID?: string;
}) {
  const type = useBrandTypography();
  return (
    <View style={[styles.toggleRow, !last && styles.divider]}>
      <View style={styles.toggleText}>
        <AppText style={[type.heading1, styles.toggleLabel]}>{label}</AppText>
        <AppText style={styles.toggleSubtitle}>{subtitle}</AppText>
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={subtitle}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(16,22,15,0.18)', true: colors.foreground }}
        ios_backgroundColor="rgba(16,22,15,0.18)"
        thumbColor={palette.cream}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 24 },
  section: { marginTop: 24, gap: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(16,22,15,0.08)' },
  toggleRow: {
    minHeight: 64,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 15, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  toggleSubtitle: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  detail: { paddingTop: 4, paddingBottom: 14, gap: 10 },
  detailLabel: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  detailNote: { fontSize: 12, lineHeight: 17, color: palette.sage },
  error: { marginTop: 12, fontSize: 13, lineHeight: 18, color: palette.negative },
  system: {
    marginTop: 4,
    padding: 18,
    borderRadius: 18,
    backgroundColor: palette.attention,
    gap: 8,
  },
  systemTitle: { fontSize: 16, lineHeight: 21, letterSpacing: 0, color: colors.textPrimary },
  systemText: { fontSize: 13, lineHeight: 19, color: palette.mutedCopy },
  systemButton: {
    marginTop: 6,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemButtonText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.cream },
  pressed: { opacity: 0.72 },
});
