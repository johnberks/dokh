import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { LoadError, MutationError } from '@/components/TechnicalStates';
import { subscriptionManagementUrls, supportUrls } from '@/config/legal';
import { supabase } from '@/data/supabase-client';
import { requestAppleAuthorizationCode } from '@/features/auth/apple-auth';
import { usePremium } from '@/features/billing/entitlement';
import { DarkButton } from '@/features/work/form/FormPieces';
import { DurationSheet, StartTimeSheet } from '@/features/work/form/ScheduleSheets';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { deleteAccount } from './delete-account';
import {
  ChoiceChips,
  FieldLabel,
  InsetList,
  InsetRow,
  Note,
  PickerField,
  type PROFILE_ICONS,
  ProfileIcon,
  SectionTitle,
  SoonBadge,
  SubScreen,
} from './ProfilePieces';
import {
  useAccount,
  useSaveWorkPreferences,
  useWorkPreferences,
  type WorkPreferences,
} from './profile-data';

const QUICK_HOURS = [6, 12, 24] as const;
const TERMS = [30, 60, 90] as const;

/**
 * Perfil 06: duração padrão (6h/12h/24h/Outro), horário padrão de início e prazo padrão de
 * entrada. São sugestões: o formulário do `+` já vem preenchido e pode mudar a cada trabalho.
 */
export function PreferencesScreen() {
  const { t } = useTranslation('profile');
  const preferences = useWorkPreferences();
  if (preferences.data) return <PreferencesForm initial={preferences.data} />;
  return (
    <SubScreen title={t('preferences.title')} onBack={() => router.back()}>
      {preferences.isError ? (
        <LoadError onRetry={() => void preferences.refetch()} retrying={preferences.isFetching} />
      ) : (
        <ActivityIndicator color={palette.sage} style={styles.loading} />
      )}
    </SubScreen>
  );
}

function PreferencesForm({ initial }: { initial: WorkPreferences }) {
  const { t } = useTranslation('profile');
  const type = useBrandTypography();
  const save = useSaveWorkPreferences();
  const [value, setValue] = useState(initial);
  const [sheet, setSheet] = useState<'start' | 'duration' | null>(null);
  const hours = value.durationMinutes === null ? null : Math.round(value.durationMinutes / 60);
  const quick = hours !== null && (QUICK_HOURS as readonly number[]).includes(hours);

  function submit() {
    save.mutate(value, { onSuccess: () => router.back() });
  }

  return (
    <SubScreen
      title={t('preferences.title')}
      onBack={() => router.back()}
      testID="preferences-screen"
      footer={
        <DarkButton
          label={t('preferences.save')}
          loading={save.isPending}
          onPress={submit}
          testID="preferences-save"
        />
      }
    >
      <AppText style={styles.lead}>{t('preferences.description')}</AppText>

      <View style={styles.section}>
        <FieldLabel>{t('preferences.duration')}</FieldLabel>
        <View accessibilityRole="radiogroup" style={styles.chips}>
          {QUICK_HOURS.map((option) => {
            const on = hours === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={t('preferences.hours', { hours: option })}
                accessibilityState={{ checked: on }}
                onPress={() => setValue({ ...value, durationMinutes: on ? null : option * 60 })}
                testID={`preferences-duration-${option}`}
                style={({ pressed }) => [
                  styles.chip,
                  on ? styles.chipOn : styles.chipOff,
                  pressed && styles.pressed,
                ]}
              >
                <AppText style={[type.heading1, styles.chipText, on && styles.chipTextOn]}>
                  {t('preferences.hours', { hours: option })}
                </AppText>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('preferences.other')}
            accessibilityState={{ selected: hours !== null && !quick }}
            onPress={() => setSheet('duration')}
            testID="preferences-duration-other"
            style={({ pressed }) => [
              styles.chip,
              hours !== null && !quick ? styles.chipOn : styles.chipOff,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              style={[
                type.heading1,
                styles.chipText,
                hours !== null && !quick && styles.chipTextOn,
              ]}
            >
              {hours !== null && !quick
                ? t('preferences.hours', { hours })
                : t('preferences.other')}
            </AppText>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <FieldLabel>{t('preferences.time')}</FieldLabel>
        <PickerField
          label={t('preferences.start')}
          value={value.startTime}
          placeholder={t('preferences.noTime')}
          onPress={() => setSheet('start')}
          testID="preferences-start"
        />
      </View>

      <View style={styles.section}>
        <FieldLabel>{t('preferences.term')}</FieldLabel>
        <ChoiceChips
          label={t('preferences.term')}
          options={[
            { value: 0, label: t('preferences.noTerm') },
            ...TERMS.map((days) => ({ value: days, label: t('preferences.termValue', { days }) })),
          ]}
          value={value.paymentTermDays ?? 0}
          onChange={(days) =>
            setValue({ ...value, paymentTermDays: days === 0 ? null : (days as 30 | 60 | 90) })
          }
          testID="preferences-term"
        />
        <Note>{t('preferences.termNote')}</Note>
      </View>

      {save.isError && <MutationError onRetry={submit} retrying={save.isPending} />}

      <StartTimeSheet
        open={sheet === 'start'}
        value={value.startTime}
        optional
        onClose={() => setSheet(null)}
        onConfirm={(startTime) => {
          setValue({ ...value, startTime });
          setSheet(null);
        }}
      />
      <DurationSheet
        open={sheet === 'duration'}
        valueMinutes={value.durationMinutes}
        workDate={null}
        startTime={value.startTime}
        onClose={() => setSheet(null)}
        onConfirm={(durationMinutes) => {
          setValue({ ...value, durationMinutes });
          setSheet(null);
        }}
      />
    </SubScreen>
  );
}

/** Perfil 15: só o tema claro existe; Sistema e Escuro aparecem como "Em breve". */
export function AppearanceScreen() {
  const { t } = useTranslation('profile');
  const type = useBrandTypography();
  const options = [
    { key: 'system', label: t('appearance.system'), available: false },
    { key: 'light', label: t('appearance.light'), available: true },
    { key: 'dark', label: t('appearance.dark'), available: false },
  ] as const;
  return (
    <SubScreen
      title={t('appearance.title')}
      onBack={() => router.back()}
      testID="appearance-screen"
    >
      <SectionTitle>{t('appearance.themeTitle')}</SectionTitle>
      <View accessibilityRole="radiogroup">
        <InsetList grouped>
          {options.map((option, index) => (
            <View
              key={option.key}
              accessible
              accessibilityRole="radio"
              accessibilityLabel={option.available ? option.label : `${option.label}, ${t('soon')}`}
              accessibilityState={{ checked: option.available, disabled: !option.available }}
              style={[styles.themeRow, index < options.length - 1 && styles.themeDivider]}
              testID={`appearance-${option.key}`}
            >
              <AppText
                style={[type.heading1, styles.themeLabel, !option.available && styles.muted]}
              >
                {option.label}
              </AppText>
              {!option.available && <SoonBadge />}
              <View style={[styles.radio, option.available && styles.radioOn]} />
            </View>
          ))}
        </InsetList>
      </View>
      <View style={styles.noteGap}>
        <Note>{t('appearance.note')}</Note>
      </View>
    </SubScreen>
  );
}

/**
 * Perfil 16: e-mail, alterar senha (link de redefinição por e-mail), método de acesso, plano,
 * `Sair da DOKH` (texto, sem vermelho) e `Excluir conta` (menor; ainda sem fluxo — P05).
 */
export function AccountScreen() {
  const { t } = useTranslation('profile');
  const type = useBrandTypography();
  const account = useAccount();
  const premium = usePremium();
  const isPremium = premium.data === true;
  const apple = account.data?.provider === 'apple';
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  async function confirmDelete() {
    if (deleting) return;
    setDeleteFailed(false);
    setDeleting(true);
    try {
      let appleCode: string | undefined;
      if (apple && Platform.OS === 'ios') {
        // A Apple reconfirma quem é a pessoa e entrega o código para revogar o acesso.
        const code = await requestAppleAuthorizationCode();
        if (code === null) return;
        appleCode = code;
      }
      await deleteAccount(supabase, appleCode);
      router.replace('/intro');
    } catch {
      setDeleteFailed(true);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SubScreen title={t('account.title')} onBack={() => router.back()} testID="account-screen">
      <SectionTitle>{t('account.accessTitle')}</SectionTitle>
      <InsetList grouped>
        <InsetRow
          label={t('account.emailLabel')}
          subtitle={account.data?.email ?? '—'}
          testID="account-email"
        />
        {!apple && (
          <InsetRow
            label={t('account.changePassword')}
            onPress={() => router.push('/recover-password')}
            testID="account-password"
          />
        )}
        <InsetRow
          label={t('account.method')}
          value={apple ? t('account.methodApple') : t('account.methodEmail')}
          accessory={<View />}
          last
          testID="account-method"
        />
      </InsetList>

      <View style={styles.groupSpacing}>
        <SectionTitle>{t('account.subscriptionTitle')}</SectionTitle>
      </View>
      <InsetList grouped>
        <InsetRow
          label={t('account.manage')}
          value={premium.isSuccess ? (isPremium ? t('account.premium') : t('account.free')) : null}
          onPress={
            isPremium
              ? () =>
                  void Linking.openURL(
                    Platform.OS === 'ios'
                      ? subscriptionManagementUrls.ios
                      : subscriptionManagementUrls.android,
                  )
              : undefined
          }
          accessory={isPremium ? undefined : <View />}
          last
          testID="account-subscription"
        />
      </InsetList>

      <View style={styles.accountActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('account.delete')}
          onPress={() => setConfirming(true)}
          testID="account-delete"
          style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}
        >
          <AppText style={styles.deleteText}>{t('account.delete')}</AppText>
        </Pressable>
      </View>

      <BottomSheet
        open={confirming}
        onClose={() => {
          if (!deleting) setConfirming(false);
        }}
        accessibilityLabel={t('account.deleteTitle')}
        testID="account-delete-sheet"
      >
        <View style={styles.sheetCopy}>
          <AppText accessibilityRole="header" style={[type.heading1, styles.sheetTitle]}>
            {t('account.deleteTitle')}
          </AppText>
          <AppText style={styles.sheetText}>{t('account.deleteText')}</AppText>
          {isPremium && (
            <AppText style={styles.sheetText}>{t('account.deleteSubscription')}</AppText>
          )}
          {apple && <AppText style={styles.sheetText}>{t('account.deleteApple')}</AppText>}
        </View>
        {deleteFailed && <MutationError onRetry={() => void confirmDelete()} retrying={deleting} />}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('account.deleteConfirm')}
          accessibilityState={{ busy: deleting, disabled: deleting }}
          disabled={deleting}
          onPress={() => void confirmDelete()}
          testID="account-delete-confirm"
          style={({ pressed }) => [styles.destructiveButton, pressed && styles.pressed]}
        >
          {deleting && <ActivityIndicator color={palette.cream} />}
          <AppText style={[type.heading1, styles.destructiveText]}>
            {t('account.deleteConfirm')}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('account.cancel')}
          disabled={deleting}
          onPress={() => setConfirming(false)}
          testID="account-delete-cancel"
          style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.sheetCancelText]}>{t('account.cancel')}</AppText>
        </Pressable>
      </BottomSheet>
    </SubScreen>
  );
}

/** Perfil 17: lista de ajuda (destinos configuráveis; sem destino, "Em breve") e convite. */
export function HelpScreen() {
  const { t } = useTranslation('profile');
  const type = useBrandTypography();
  const rows: { key: keyof typeof supportUrls; icon: keyof typeof PROFILE_ICONS; label: string }[] =
    [
      { key: 'helpCenter', icon: 'book', label: t('help.center') },
      { key: 'contact', icon: 'chat', label: t('help.contact') },
      { key: 'feedback', icon: 'star', label: t('help.feedback') },
      { key: 'problem', icon: 'flag', label: t('help.problem') },
    ];
  // Só o que tem destino aparece; o resto entra sozinho quando o link for configurado.
  const available = rows.flatMap((row) => {
    const url = supportUrls[row.key];
    return url ? [{ ...row, url }] : [];
  });
  const feedback = supportUrls.feedback;
  return (
    <SubScreen title={t('help.title')} onBack={() => router.back()} testID="help-screen">
      {available.length > 0 && (
        <InsetList grouped>
          {available.map((row, index) => (
            <InsetRow
              key={row.key}
              icon={<ProfileIcon name={row.icon} size={20} />}
              label={row.label}
              onPress={() => void Linking.openURL(row.url)}
              last={index === available.length - 1}
              testID={`help-${row.key}`}
            />
          ))}
        </InsetList>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('help.inviteTitle')} ${t('help.feedback')}`}
        accessibilityState={{ disabled: feedback === null }}
        disabled={feedback === null}
        onPress={() => feedback && void Linking.openURL(feedback)}
        testID="help-invite"
        style={({ pressed }) => [styles.invite, pressed && styles.pressed]}
      >
        <AppText variant="technical" style={styles.inviteEyebrow}>
          {t('help.inviteEyebrow')}
        </AppText>
        <AppText style={[type.heading1, styles.inviteTitle]}>{t('help.inviteTitle')}</AppText>
        <AppText style={styles.inviteText}>{t('help.inviteText')}</AppText>
        {feedback !== null && (
          <View style={styles.inviteCta}>
            <AppText style={[type.heading1, styles.inviteCtaText]}>{t('help.feedback')}</AppText>
            <AppText style={[type.heading1, styles.inviteArrow]}>{'→'}</AppText>
          </View>
        )}
      </Pressable>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 32 },
  lead: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
  section: { marginTop: 22, gap: 10 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.foreground, backgroundColor: colors.foreground },
  chipOff: { borderColor: 'rgba(16,22,15,0.12)', backgroundColor: palette.previewPaper },
  chipText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  chipTextOn: { color: palette.cream },
  groupSpacing: { marginTop: 30 },
  themeRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14 },
  themeDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(16,22,15,0.08)' },
  themeLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  muted: { color: palette.sage },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(16,22,15,0.3)',
  },
  radioOn: { borderWidth: 7, borderColor: colors.foreground },
  noteGap: { marginTop: 14 },
  accountActions: { marginTop: 48, alignItems: 'center', gap: 10 },
  textAction: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteText: { fontSize: 13, lineHeight: 17, color: palette.sage },
  sheetCopy: { gap: 8, paddingTop: 6 },
  sheetTitle: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: colors.textPrimary },
  sheetText: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
  destructiveButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: palette.negative,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  destructiveText: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  sheetCancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  sheetCancelText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  invite: {
    marginTop: 30,
    overflow: 'hidden',
    backgroundColor: palette.base,
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 20,
    gap: 10,
  },
  inviteEyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.bronze },
  inviteTitle: { fontSize: 22, lineHeight: 25, letterSpacing: -0.66, color: palette.cream },
  inviteText: { fontSize: 14, lineHeight: 21, color: '#B9BFB2' },
  inviteCta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  inviteCtaText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.cream },
  inviteArrow: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.bronze },
  pressed: { opacity: 0.72 },
});
