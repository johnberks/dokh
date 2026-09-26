import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Plus from 'lucide-react-native/icons/plus';
import ReceiptText from 'lucide-react-native/icons/receipt-text';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, emptyStateMetrics, shadow } from '@/theme/tokens';
import { AppText } from './AppText';

type CommonProps = { testID?: string };
type PrimaryProps = CommonProps & { onPrimaryPress: () => void };

export type EmptyStateProps =
  | (PrimaryProps & {
      variant:
        | 'homeEntries'
        | 'homeWork'
        | 'agendaDay'
        | 'financesNoWork'
        | 'profileLocations'
        | 'profileResidency';
    })
  | (CommonProps & { variant: 'entriesMonth'; periodLabel: string })
  | (PrimaryProps & { variant: 'financesNextEntry'; description: string })
  | (PrimaryProps & { variant: 'profileImportNoData'; onSecondaryPress: () => void });

type ActionAppearance = 'dark' | 'darkSmall' | 'darkCompact' | 'outline' | 'bronzeLink' | 'quiet';

function EmptyAction({
  label,
  onPress,
  appearance,
  glyph,
  testID,
}: {
  label: string;
  onPress: () => void;
  appearance: ActionAppearance;
  glyph?: 'plus' | 'arrow';
  testID?: string;
}) {
  const dark = appearance === 'dark' || appearance === 'darkSmall' || appearance === 'darkCompact';
  const link = appearance === 'bronzeLink';
  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={link ? 13 : appearance === 'outline' ? 2 : undefined}
      testID={testID}
      style={({ pressed }) => [styles.action, styles[appearance], pressed && styles.pressed]}
    >
      <View style={styles.actionLabelRow}>
        {appearance === 'darkSmall' ? (
          <ReceiptText color={colors.accent} size={16} strokeWidth={1.6} />
        ) : null}
        <AppText
          variant="heading1"
          style={[
            styles.actionText,
            dark && styles.darkActionText,
            (appearance === 'outline' || link) && styles.compactActionText,
            appearance === 'darkSmall' && styles.smallActionText,
            appearance === 'bronzeLink' && styles.bronzeActionText,
            appearance === 'quiet' && styles.quietActionText,
            appearance === 'darkCompact' && styles.darkCompactActionText,
          ]}
        >
          {label}
        </AppText>
      </View>
      {glyph === 'plus' ? (
        <Plus
          color={dark ? colors.accent : colors.textPrimary}
          size={appearance === 'outline' ? 16 : 20}
          strokeWidth={1.8}
        />
      ) : null}
      {glyph === 'arrow' ? (
        <ArrowRight
          color={dark || appearance === 'bronzeLink' ? colors.accent : colors.textPrimary}
          size={appearance === 'bronzeLink' ? 14 : 16}
          strokeWidth={1.8}
        />
      ) : null}
    </Pressable>
  );
}

/** Valid empty data only. Failed reads must render LoadError instead. */
export function EmptyState(props: EmptyStateProps) {
  const { t } = useTranslation(['home', 'agenda', 'finances', 'profile']);

  if (props.variant === 'homeEntries') {
    return (
      <View testID={props.testID} style={styles.homeEntries}>
        <AppText accessibilityRole="header" variant="heading1" style={styles.homeEntriesTitle}>
          {t('home:empty.noEntriesTitle')}
        </AppText>
        <AppText style={styles.homeEntriesDescription}>
          {t('home:empty.noEntriesDescription')}
        </AppText>
        <EmptyAction
          label={t('home:empty.addWork')}
          onPress={props.onPrimaryPress}
          appearance="bronzeLink"
          glyph="arrow"
          testID={props.testID ? `${props.testID}-action` : undefined}
        />
      </View>
    );
  }

  if (props.variant === 'homeWork') {
    const label = [
      t('home:empty.nextWorkEyebrow'),
      t('home:empty.noWorkTitle'),
      t('home:empty.noWorkDescription'),
      t('home:empty.addWork'),
    ].join(', ');
    return (
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={props.onPrimaryPress}
        testID={props.testID}
        style={({ pressed }) => [styles.homeWork, shadow.raised, pressed && styles.pressed]}
      >
        <AppText variant="technical" style={styles.homeWorkEyebrow}>
          {t('home:empty.nextWorkEyebrow')}
        </AppText>
        <AppText accessibilityRole="header" variant="heading1" style={styles.homeWorkTitle}>
          {t('home:empty.noWorkTitle')}
        </AppText>
        <AppText style={styles.homeWorkDescription}>{t('home:empty.noWorkDescription')}</AppText>
        <View accessible={false} style={styles.homeWorkAction}>
          <AppText variant="heading1" style={styles.homeWorkActionText}>
            {t('home:empty.addWork')}
          </AppText>
          <ArrowRight color={colors.textPrimary} size={16} strokeWidth={1.8} />
        </View>
      </Pressable>
    );
  }

  if (props.variant === 'agendaDay') {
    return (
      <View testID={props.testID} style={styles.agendaDay}>
        <View style={styles.agendaCopy}>
          <AppText accessibilityRole="header" variant="heading1" style={styles.agendaTitle}>
            {t('agenda:empty.freeDayTitle')}
          </AppText>
          <AppText style={styles.agendaDescription}>{t('agenda:empty.freeDayDescription')}</AppText>
        </View>
        <EmptyAction
          label={t('agenda:empty.addWork')}
          onPress={props.onPrimaryPress}
          appearance="darkCompact"
          glyph="plus"
          testID={props.testID ? `${props.testID}-action` : undefined}
        />
      </View>
    );
  }

  if (props.variant === 'financesNoWork') {
    const teaserKeys = ['teaserOne', 'teaserTwo', 'teaserThree'] as const;
    return (
      <View testID={props.testID} style={styles.financeNoWork}>
        <View style={styles.financeIntro}>
          <AppText accessibilityRole="header" variant="heading1" style={styles.financeTitle}>
            {t('finances:empty.noWorkTitle')}
          </AppText>
          <AppText style={styles.financeDescription}>
            {t('finances:empty.noWorkDescription')}
          </AppText>
          <EmptyAction
            label={t('finances:empty.addWork')}
            onPress={props.onPrimaryPress}
            appearance="dark"
            glyph="plus"
            testID={props.testID ? `${props.testID}-action` : undefined}
          />
        </View>
        <View accessible={false} style={styles.financeTeaser}>
          <AppText variant="technical" style={styles.eyebrow}>
            {t('finances:empty.teaserEyebrow')}
          </AppText>
          {teaserKeys.map((key, index) => (
            <View key={key} style={styles.teaserRow}>
              <View style={styles.teaserNumberCircle}>
                <AppText variant="technical" style={styles.teaserNumber}>
                  {index + 1}
                </AppText>
              </View>
              <AppText style={styles.teaserText}>{t(`finances:empty.${key}`)}</AppText>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (props.variant === 'entriesMonth') {
    return (
      <View testID={props.testID} style={styles.entriesMonth}>
        <AppText variant="technical" style={styles.eyebrow}>
          {props.periodLabel}
        </AppText>
        <AppText accessibilityRole="header" variant="heading1" style={styles.centeredTitle}>
          {t('finances:empty.entriesTitle')}
        </AppText>
        <AppText style={styles.centeredDescription}>
          {t('finances:empty.entriesDescription')}
        </AppText>
      </View>
    );
  }

  if (props.variant === 'financesNextEntry') {
    return (
      <View testID={props.testID} style={styles.nextEntry}>
        <View style={styles.nextEntryCopy}>
          <AppText variant="technical" style={styles.eyebrow}>
            {t('finances:empty.nextEntryEyebrow')}
          </AppText>
          <View style={styles.nextEntryTitleLine}>
            <View accessible={false} style={styles.nextEntryDot} />
            <AppText accessibilityRole="header" variant="heading1" style={styles.nextEntryTitle}>
              {t('finances:empty.nextEntryTitle')}
            </AppText>
          </View>
          <AppText style={styles.nextEntryDescription}>{props.description}</AppText>
        </View>
        <EmptyAction
          label={t('finances:empty.seeStatement')}
          onPress={props.onPrimaryPress}
          appearance="darkSmall"
          glyph="arrow"
          testID={props.testID ? `${props.testID}-action` : undefined}
        />
      </View>
    );
  }

  if (props.variant === 'profileLocations' || props.variant === 'profileResidency') {
    const locations = props.variant === 'profileLocations';
    return (
      <View testID={props.testID} style={styles.profileCentered}>
        <AppText variant="technical" style={styles.eyebrow}>
          {locations
            ? t('profile:empty.noLocationsEyebrow')
            : t('profile:empty.noResidencyEyebrow')}
        </AppText>
        <AppText accessibilityRole="header" variant="heading1" style={styles.centeredTitle}>
          {locations ? t('profile:empty.noLocationsTitle') : t('profile:empty.noResidencyTitle')}
        </AppText>
        <AppText style={styles.centeredDescription}>
          {locations
            ? t('profile:empty.noLocationsDescription')
            : t('profile:empty.noResidencyDescription')}
        </AppText>
        <View style={styles.profileActionGroup}>
          <EmptyAction
            label={
              locations ? t('profile:empty.addFirstLocation') : t('profile:empty.addResidency')
            }
            onPress={props.onPrimaryPress}
            appearance="dark"
            glyph={locations ? 'plus' : undefined}
            testID={props.testID ? `${props.testID}-action` : undefined}
          />
          {locations ? null : (
            <AppText style={styles.profileResidencyNote}>
              {t('profile:empty.noResidencyNote')}
            </AppText>
          )}
        </View>
      </View>
    );
  }

  if (props.variant === 'profileImportNoData') {
    return (
      <View testID={props.testID} style={styles.importNoData}>
        <View style={styles.importCopy}>
          <AppText variant="technical" style={styles.eyebrow}>
            {t('profile:empty.importNoDataEyebrow')}
          </AppText>
          <AppText accessibilityRole="header" variant="heading1" style={styles.centeredTitle}>
            {t('profile:empty.importNoDataTitle')}
          </AppText>
          <AppText style={styles.centeredDescription}>
            {t('profile:empty.importNoDataDescription')}
          </AppText>
        </View>
        <View>
          <EmptyAction
            label={t('profile:empty.selectAnotherFile')}
            onPress={props.onPrimaryPress}
            appearance="dark"
            testID={props.testID ? `${props.testID}-action` : undefined}
          />
          <EmptyAction
            label={t('profile:empty.howToExport')}
            onPress={props.onSecondaryPress}
            appearance="quiet"
            testID={props.testID ? `${props.testID}-secondary` : undefined}
          />
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  actionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionText: { fontSize: 16, lineHeight: 20 },
  compactActionText: { fontSize: 14, lineHeight: 18 },
  smallActionText: { fontSize: 15, lineHeight: 20 },
  darkActionText: { color: colors.darkTextPrimary },
  bronzeActionText: { color: colors.accent },
  quietActionText: { fontSize: 15 },
  dark: {
    minHeight: emptyStateMetrics.profileButtonHeight,
    borderRadius: emptyStateMetrics.profileButtonRadius,
    backgroundColor: colors.darkBackground,
  },
  darkSmall: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.darkBackground,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  outline: {
    minHeight: emptyStateMetrics.compactButtonHeight,
    paddingHorizontal: 18,
    borderRadius: emptyStateMetrics.compactButtonRadius,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    gap: 8,
  },
  // Dia livre da Agenda: preenchido para ser o próximo passo óbvio (pedido do usuário,
  // 2026-09-25); espaçamento de letras neutro, porque o do título grudava as palavras.
  darkCompact: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.darkBackground,
    gap: 10,
  },
  darkCompactActionText: { fontSize: 15, lineHeight: 20, letterSpacing: 0.2 },
  bronzeLink: { alignSelf: 'flex-start', gap: 8 },
  quiet: { minHeight: 48 },
  homeEntries: { gap: 14 },
  homeEntriesTitle: {
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.65,
    color: colors.darkTextPrimary,
  },
  homeEntriesDescription: { fontSize: 14, lineHeight: 22, color: colors.darkTextSecondary },
  homeWork: {
    minHeight: emptyStateMetrics.actionHitTarget,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.workCardBorder,
    borderRadius: emptyStateMetrics.cardRadius,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 24,
    gap: 12,
  },
  homeWorkEyebrow: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.8,
    color: colors.darkTextSecondary,
  },
  homeWorkTitle: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4 },
  homeWorkDescription: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  homeWorkAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
  homeWorkActionText: { fontSize: 14, lineHeight: 18 },
  agendaDay: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.emptyOutline,
    borderRadius: emptyStateMetrics.cardRadius,
    paddingVertical: emptyStateMetrics.agendaPaddingVertical,
    paddingHorizontal: emptyStateMetrics.agendaPaddingHorizontal,
    gap: 14,
    alignItems: 'flex-start',
  },
  agendaCopy: { gap: 4 },
  agendaTitle: { fontSize: 18, lineHeight: 22, letterSpacing: -0.18 },
  agendaDescription: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  financeNoWork: { paddingTop: 24, gap: 30 },
  financeIntro: { gap: 14 },
  financeTitle: { fontSize: 30, lineHeight: 32, letterSpacing: -0.9 },
  financeDescription: { fontSize: 15, lineHeight: 23, color: colors.textMuted },
  financeTeaser: { gap: 14, opacity: 0.55 },
  teaserRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teaserNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.emptyTeaserOutline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaserNumber: { fontSize: 10, lineHeight: 14 },
  teaserText: { fontSize: 15, lineHeight: 22 },
  entriesMonth: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: emptyStateMetrics.entriesHorizontalInset,
    paddingBottom: emptyStateMetrics.profileBottomInset,
    gap: 10,
  },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: colors.darkTextSecondary },
  centeredTitle: { fontSize: 26, lineHeight: 29, letterSpacing: -0.78 },
  centeredDescription: { fontSize: 15, lineHeight: 23, color: colors.textMuted },
  nextEntry: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.emptyDashedOutline,
    borderRadius: emptyStateMetrics.cardRadius,
    padding: 18,
    gap: 16,
  },
  nextEntryCopy: { gap: 10 },
  nextEntryTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextEntryDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.emptyFutureDot,
  },
  nextEntryTitle: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: colors.textMuted },
  nextEntryDescription: { fontSize: 13, lineHeight: 20, color: colors.textMuted },
  profileCentered: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    paddingBottom: emptyStateMetrics.profileBottomInset,
  },
  profileActionGroup: { gap: 8, marginTop: 10 },
  profileResidencyNote: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.darkTextSecondary,
    textAlign: 'center',
  },
  importNoData: { flex: 1 },
  importCopy: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    paddingBottom: emptyStateMetrics.importBottomInset,
  },
});
