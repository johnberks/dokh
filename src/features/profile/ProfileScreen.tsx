import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polyline, Rect } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { TwoToneScrollScreen } from '@/components/Layout';
import { LoadError } from '@/components/TechnicalStates';
import { legalUrls, subscriptionManagementUrls, supportUrls } from '@/config/legal';
import { AgendaHeroBackdrop } from '@/features/agenda/AgendaHeroBackdrop';
import { usePremium } from '@/features/billing/entitlement';
import { useWorkLocations } from '@/features/locations/locations-data';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { type PROFILE_ICONS, ProfileIcon, SoonBadge } from './ProfilePieces';
import { initialsOf, type Profile, useActiveResidency, useProfile } from './profile-data';

const HERO_SECONDARY = '#B9BFB2';

/** Símbolo DOKH do card Premium (quadrados sobrepostos, acento bronze). */
function PremiumMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" accessible={false}>
      <Rect x={14} y={14} width={62} height={62} rx={10} fill="rgba(237,234,224,0.18)" />
      <Rect x={44} y={44} width={62} height={62} rx={10} fill={palette.bronze} />
      <Rect x={44} y={44} width={32} height={32} fill={palette.cream} opacity={0.9} />
    </Svg>
  );
}

export function Avatar({ profile, size }: { profile: Profile; size: number }) {
  const type = useBrandTypography();
  const frame = { width: size, height: size, borderRadius: size / 2 };
  if (profile.avatarUrl) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: profile.avatarUrl }}
        style={[styles.avatar, frame]}
        testID="profile-avatar-photo"
      />
    );
  }
  return (
    <View style={[styles.avatar, frame]} testID="profile-avatar-initials">
      <AppText style={[type.heading1, styles.initials, { fontSize: size * 0.34 }]}>
        {initialsOf(profile.displayName)}
      </AppText>
    </View>
  );
}

function statusLine(profile: Profile, t: TFunction<'profile'>): string {
  if (profile.status === 'general_practitioner') return t('main.generalist');
  return profile.specialty
    ? t('main.resident', { specialty: profile.specialty })
    : t('main.residentNoSpecialty');
}

type Row = {
  icon: keyof typeof PROFILE_ICONS;
  label: string;
  value?: string | null;
  onPress?: () => void;
  soon?: boolean;
  testID: string;
};

/** Grupo do Perfil 01: cartão claro com ícone e rótulo, e uma bandeja de linhas. */
function Group({
  icon,
  title,
  rows,
}: {
  icon: keyof typeof PROFILE_ICONS;
  title: string;
  rows: Row[];
}) {
  const type = useBrandTypography();
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <View style={styles.groupIcon}>
          <ProfileIcon name={icon} size={16} color={palette.structure} />
        </View>
        <AppText variant="technical" style={styles.groupTitle}>
          {title}
        </AppText>
      </View>
      <View style={styles.tray}>
        {rows.map((row) => (
          <Pressable
            key={row.testID}
            accessibilityRole="button"
            accessibilityLabel={row.value ? `${row.label}, ${row.value}` : row.label}
            accessibilityState={{ disabled: row.soon === true }}
            disabled={row.soon === true || !row.onPress}
            onPress={row.onPress}
            testID={row.testID}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <ProfileIcon name={row.icon} color={row.soon ? palette.sage : colors.foreground} />
            <AppText
              numberOfLines={1}
              style={[type.heading1, styles.rowLabel, row.soon && styles.rowMuted]}
            >
              {row.label}
            </AppText>
            {row.value ? (
              <AppText numberOfLines={1} style={styles.rowValue}>
                {row.value}
              </AppText>
            ) : null}
            {row.soon ? <SoonBadge /> : <AppText style={styles.chevron}>{'›'}</AppText>}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function openUrl(url: string | null) {
  if (url) void Linking.openURL(url);
}

/**
 * Perfil 01 (Free) e 18 (Premium ativo): identidade no topo escuro, Premium (card de
 * descoberta no Free, linha compacta para quem assina — sem venda), grupos de configuração,
 * privacidade e versão. Importação, calendário e notificações entram quando existirem.
 */
export function ProfileScreen() {
  const { t } = useTranslation('profile');
  const { t: tComponents } = useTranslation('components');
  const type = useBrandTypography();
  const profile = useProfile();
  const premium = usePremium();
  const locations = useWorkLocations();
  const residency = useActiveResidency();
  const isPremium = premium.data === true;
  const version = Constants.expoConfig?.version ?? '1.0';

  const data = profile.data;
  const hero = (
    <View style={styles.hero}>
      <StatusBar style="light" />
      <AppText variant="technical" style={styles.eyebrow}>
        {t('main.eyebrow')}
      </AppText>
      {data ? (
        <>
          <View style={styles.identity}>
            <Avatar profile={data} size={64} />
            <View style={styles.identityText}>
              <AppText
                accessibilityRole="header"
                numberOfLines={2}
                style={[type.heading1, styles.name]}
              >
                {data.displayName}
              </AppText>
              <AppText numberOfLines={1} style={styles.status}>
                {statusLine(data, t)}
              </AppText>
              {data.city ? (
                <AppText numberOfLines={1} style={styles.city}>
                  {data.city}
                </AppText>
              ) : null}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('main.edit')}
            hitSlop={8}
            onPress={() => router.push('/profile/edit')}
            testID="profile-edit"
            style={({ pressed }) => [styles.editLink, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.editText]}>{t('main.edit')}</AppText>
            <AppText style={[type.heading1, styles.editArrow]}>{'→'}</AppText>
          </Pressable>
        </>
      ) : (
        <View style={styles.identityPlaceholder} />
      )}
    </View>
  );

  let premiumBlock: ReactNode = null;
  if (premium.isSuccess && isPremium) {
    premiumBlock = (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('main.premiumEyebrow')}, ${t('main.premiumActive')}, ${t('main.manageSubscription')}`}
        onPress={() =>
          openUrl(
            Platform.OS === 'ios'
              ? subscriptionManagementUrls.ios
              : subscriptionManagementUrls.android,
          )
        }
        testID="profile-premium-active"
        style={({ pressed }) => [styles.premiumRow, pressed && styles.pressedDown]}
      >
        <PremiumMark size={28} />
        <View style={styles.premiumRowText}>
          <View style={styles.premiumRowTop}>
            <AppText variant="technical" style={styles.premiumEyebrow}>
              {t('main.premiumEyebrow')}
            </AppText>
            <View style={styles.activeTag}>
              <Svg width={9} height={7} viewBox="0 0 12 10" fill="none" accessible={false}>
                <Polyline points="1,5 4.5,8.5 11,1.5" stroke={palette.bronze} strokeWidth={2} />
              </Svg>
              <AppText variant="technical" style={styles.activeText}>
                {t('main.premiumActive')}
              </AppText>
            </View>
          </View>
          <AppText style={[type.heading1, styles.premiumRowLabel]}>
            {t('main.manageSubscription')}
          </AppText>
        </View>
        <AppText style={styles.premiumChevron}>{'›'}</AppText>
      </Pressable>
    );
  } else if (premium.isSuccess) {
    // Sem o fluxo de benefícios (5.5), o card explica o Premium e não leva a lugar nenhum.
    premiumBlock = (
      <View
        accessible
        accessibilityLabel={`${t('main.premiumEyebrow')}. ${t('main.premiumTitle')} ${t('main.premiumDescription')}`}
        style={styles.premiumCard}
        testID="profile-premium-card"
      >
        <View style={styles.premiumCardMark}>
          <PremiumMark size={34} />
        </View>
        <AppText variant="technical" style={styles.premiumEyebrow}>
          {t('main.premiumEyebrow')}
        </AppText>
        <AppText style={[type.heading1, styles.premiumTitle]}>{t('main.premiumTitle')}</AppText>
        <AppText style={styles.premiumDescription}>{t('main.premiumDescription')}</AppText>
        <View style={styles.premiumCta}>
          <AppText style={[type.heading1, styles.premiumCtaText]}>{t('main.premiumCta')}</AppText>
          <View style={styles.darkSoon}>
            <AppText variant="technical" style={styles.darkSoonText}>
              {t('soon')}
            </AppText>
          </View>
        </View>
      </View>
    );
  }

  const locationCount = locations.data?.length;
  const groups = (
    <>
      <Group
        icon="briefcase"
        title={t('main.groupWork')}
        rows={[
          {
            icon: 'pin',
            label: t('main.locations'),
            value: locationCount === undefined ? null : String(locationCount),
            onPress: () => router.push('/profile/locations'),
            testID: 'profile-row-locations',
          },
          {
            icon: 'residency',
            label: t('main.residency'),
            value: residency.data?.specialty ?? null,
            onPress: () => router.push('/profile/residency'),
            testID: 'profile-row-residency',
          },
          {
            icon: 'sliders',
            label: t('main.workPreferences'),
            onPress: () => router.push('/profile/preferences'),
            testID: 'profile-row-preferences',
          },
        ]}
      />
      <Group
        icon="sliders"
        title={t('main.groupPreferences')}
        rows={[
          {
            icon: 'sun',
            label: t('main.appearance'),
            value: t('main.appearanceValue'),
            onPress: () => router.push('/profile/appearance'),
            testID: 'profile-row-appearance',
          },
        ]}
      />
      <Group
        icon="person"
        title={t('main.groupAccount')}
        rows={[
          {
            icon: 'shield',
            label: t('main.account'),
            onPress: () => router.push('/profile/account'),
            testID: 'profile-row-account',
          },
          {
            icon: 'help',
            label: t('main.help'),
            onPress: () => router.push('/profile/help'),
            testID: 'profile-row-help',
          },
          {
            icon: 'star',
            label: t('main.rate'),
            soon: supportUrls.rate === null,
            onPress: () => openUrl(supportUrls.rate),
            testID: 'profile-row-rate',
          },
        ]}
      />
    </>
  );

  return (
    <TwoToneScrollScreen
      heroBackground={<AgendaHeroBackdrop />}
      hero={hero}
      bodyStyle={styles.body}
      testID="profile-screen"
    >
      {profile.isError ? (
        <LoadError
          onRetry={() => void profile.refetch()}
          retrying={profile.isFetching}
          testID="profile-error"
        />
      ) : (
        <View style={styles.sections}>
          {premiumBlock}
          {groups}
          <View>
            <AppText variant="technical" style={styles.privacyTitle}>
              {t('main.groupPrivacy')}
            </AppText>
            {(
              [
                ['terms', legalUrls.terms],
                ['privacy', legalUrls.privacy],
              ] as const
            ).map(([key, url]) => (
              <Pressable
                key={key}
                accessibilityRole="link"
                accessibilityLabel={t(`main.${key}`)}
                accessibilityState={{ disabled: url === null }}
                disabled={url === null}
                onPress={() => openUrl(url)}
                testID={`profile-${key}`}
                style={({ pressed }) => [styles.privacyRow, pressed && styles.pressed]}
              >
                <AppText style={styles.privacyLabel}>{t(`main.${key}`)}</AppText>
                {url === null ? <SoonBadge /> : <AppText style={styles.chevron}>{'›'}</AppText>}
              </Pressable>
            ))}
          </View>
          <AppText variant="technical" style={styles.version}>
            {t('main.version', { version })}
          </AppText>
        </View>
      )}
      {/* Catálogo de componentes (só em desenvolvimento). */}
      {__DEV__ && (
        <View style={styles.devTools}>
          <Button
            label={tComponents('catalog.title')}
            variant="secondary"
            onPress={() => router.push('/dev/primitives')}
          />
        </View>
      )}
    </TwoToneScrollScreen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 22, paddingHorizontal: 24, paddingBottom: 44, gap: 22 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  identityPlaceholder: { height: 64 },
  identityText: { flex: 1, minWidth: 0, gap: 4 },
  avatar: {
    backgroundColor: palette.structure,
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { letterSpacing: -0.4, color: palette.cream },
  name: { fontSize: 22, lineHeight: 25, letterSpacing: -0.44, color: palette.cream },
  status: { fontSize: 14, lineHeight: 18, color: HERO_SECONDARY },
  city: { fontSize: 13, lineHeight: 17, color: palette.sage },
  editLink: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 },
  editText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.cream },
  editArrow: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.bronze },
  body: {
    marginTop: -28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 26,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sections: { gap: 30 },
  premiumCard: {
    overflow: 'hidden',
    backgroundColor: palette.base,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.structure,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 14,
    shadowColor: palette.base,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
  premiumCardMark: { position: 'absolute', right: 20, top: 18 },
  premiumEyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.bronze },
  premiumTitle: {
    maxWidth: 220,
    fontSize: 24,
    lineHeight: 27,
    letterSpacing: -0.72,
    color: palette.cream,
  },
  premiumDescription: { maxWidth: 280, fontSize: 14, lineHeight: 21, color: HERO_SECONDARY },
  premiumCta: {
    minHeight: 44,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 12,
    backgroundColor: 'rgba(237,234,224,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumCtaText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.cream },
  darkSoon: {
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.24)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  darkSoonText: { fontSize: 9, lineHeight: 12, letterSpacing: 1.26, color: HERO_SECONDARY },
  premiumRow: {
    backgroundColor: palette.base,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.structure,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  premiumRowText: { flex: 1, minWidth: 0, gap: 3 },
  premiumRowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeText: { fontSize: 9, lineHeight: 12, letterSpacing: 1.26, color: palette.cream },
  premiumRowLabel: { fontSize: 14, lineHeight: 18, letterSpacing: -0.14, color: palette.cream },
  premiumChevron: { fontSize: 18, lineHeight: 22, color: palette.bronze },
  group: {
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.16)',
    borderRadius: 22,
    padding: 14,
    gap: 10,
    shadowColor: palette.base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 2,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(16,22,15,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  tray: { backgroundColor: 'rgba(16,22,15,0.045)', borderRadius: 16, padding: 6, gap: 4 },
  row: {
    minHeight: 48,
    backgroundColor: palette.previewPaper,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.14,
    color: colors.textPrimary,
  },
  rowMuted: { color: palette.sage },
  rowValue: { maxWidth: 140, fontSize: 13, lineHeight: 17, color: palette.mutedCopy },
  chevron: { fontSize: 16, lineHeight: 20, color: palette.sage },
  privacyTitle: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.8,
    color: palette.sage,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  privacyRow: {
    minHeight: 44,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyLabel: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  version: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.44,
    color: palette.sage,
    textAlign: 'center',
    marginTop: -10,
  },
  devTools: { marginTop: 24 },
  pressed: { opacity: 0.72 },
  pressedDown: { transform: [{ translateY: 1 }] },
});
