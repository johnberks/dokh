import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { TFunction } from 'i18next';
import { type ReactNode, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import Svg, { Polyline, Rect } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { LoadError } from '@/components/TechnicalStates';
import { legalUrls, subscriptionManagementUrls, supportUrls } from '@/config/legal';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { usePremium } from '@/features/billing/entitlement';
import { useWorkLocations } from '@/features/locations/locations-data';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { InsetList, InsetRow, Note, ProfileIcon, SectionTitle } from './ProfilePieces';
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

function openUrl(url: string | null) {
  if (url) void Linking.openURL(url);
}

/**
 * Perfil 01/18, revisto com referências da Mobbin (Cash App, Wise, GoHenry — 2026-09-27):
 * topo claro e pessoal (avatar com câmera, nome, situação e números reais), listas de um nível
 * com títulos em texto normal, `Sair da DOKH` no fim e só o que já funciona. O bloco Premium
 * (card no Free, linha no Premium) segue o HTML.
 */
export function ProfileScreen() {
  const { t } = useTranslation('profile');
  const { t: tComponents } = useTranslation('components');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const { signOut } = useAuthSession();
  const profile = useProfile();
  const premium = usePremium();
  const locations = useWorkLocations();
  const residency = useActiveResidency();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);
  const isPremium = premium.data === true;
  const version = Constants.expoConfig?.version ?? '1.0';
  const data = profile.data;

  async function leave() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutFailed(false);
    try {
      await signOut();
    } catch {
      setSignOutFailed(true);
      setSigningOut(false);
    }
  }

  const locationCount = locations.data?.length ?? 0;

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

  const helpAvailable = Object.values(supportUrls).some((url) => url !== null);
  const privacyRows = (
    [
      ['terms', legalUrls.terms],
      ['privacy', legalUrls.privacy],
    ] as const
  ).filter(([, url]) => url !== null);

  const accountRows: ReactNode[] = [
    <InsetRow
      key="account"
      icon={<ProfileIcon name="shield" />}
      label={t('main.account')}
      onPress={() => router.push('/profile/account')}
      testID="profile-row-account"
    />,
  ];
  if (helpAvailable) {
    accountRows.push(
      <InsetRow
        key="help"
        icon={<ProfileIcon name="help" />}
        label={t('main.help')}
        onPress={() => router.push('/profile/help')}
        testID="profile-row-help"
      />,
    );
  }
  if (supportUrls.rate) {
    const rate = supportUrls.rate;
    accountRows.push(
      <InsetRow
        key="rate"
        icon={<ProfileIcon name="star" />}
        label={t('main.rate')}
        onPress={() => openUrl(rate)}
        testID="profile-row-rate"
      />,
    );
  }
  accountRows.push(
    <InsetRow
      key="sign-out"
      icon={<ProfileIcon name="logout" />}
      label={t('main.signOut')}
      subtitle={signOutFailed ? t('account.signOutError') : null}
      onPress={() => void leave()}
      accessory={<View />}
      last
      testID="profile-sign-out"
    />,
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
      testID="profile-screen"
    >
      <StatusBar style="dark" />
      {data ? (
        <View style={styles.identity} testID="profile-identity">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('main.edit')}
            hitSlop={6}
            onPress={() => router.push('/profile/edit')}
            testID="profile-edit"
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <ProfileIcon name="pencil" size={18} />
          </Pressable>
          <View style={styles.avatarRing}>
            <Avatar profile={data} size={96} />
          </View>
          <AppText
            accessibilityRole="header"
            numberOfLines={2}
            style={[type.heading1, styles.name]}
          >
            {data.displayName}
          </AppText>
          <View style={styles.tags} testID="profile-tags">
            <View style={[styles.tag, styles.tagStatus]}>
              <AppText variant="heading2" style={[styles.tagText, styles.tagStatusText]}>
                {statusLine(data, t)}
              </AppText>
            </View>
            {data.graduationYear !== null && (
              <View style={styles.tag}>
                <AppText variant="heading2" style={styles.tagText}>
                  {t('main.graduatedIn', { year: data.graduationYear })}
                </AppText>
              </View>
            )}
            {data.city ? (
              <View style={styles.tag}>
                <AppText variant="heading2" style={styles.tagText}>
                  {data.city}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      ) : profile.isError ? (
        <LoadError
          onRetry={() => void profile.refetch()}
          retrying={profile.isFetching}
          testID="profile-error"
        />
      ) : (
        <View style={styles.identityPlaceholder} />
      )}

      {premiumBlock ? <View style={styles.premium}>{premiumBlock}</View> : null}

      <View style={styles.section}>
        <SectionTitle>{t('main.sectionWork')}</SectionTitle>
        <InsetList>
          <InsetRow
            icon={<ProfileIcon name="pin" />}
            label={t('main.locations')}
            value={locations.data ? String(locationCount) : null}
            onPress={() => router.push('/profile/locations')}
            testID="profile-row-locations"
          />
          <InsetRow
            icon={<ProfileIcon name="residency" />}
            label={t('main.residency')}
            value={residency.data?.specialty ?? null}
            onPress={() => router.push('/profile/residency')}
            testID="profile-row-residency"
          />
          <InsetRow
            icon={<ProfileIcon name="sliders" />}
            label={t('main.workPreferences')}
            onPress={() => router.push('/profile/preferences')}
            last
            testID="profile-row-preferences"
          />
        </InsetList>
      </View>

      <View style={styles.section}>
        <SectionTitle>{t('main.sectionPreferences')}</SectionTitle>
        <InsetList>
          <InsetRow
            icon={<ProfileIcon name="sun" />}
            label={t('main.appearance')}
            value={t('main.appearanceValue')}
            onPress={() => router.push('/profile/appearance')}
            last
            testID="profile-row-appearance"
          />
        </InsetList>
      </View>

      <View style={styles.section}>
        <SectionTitle>{t('main.sectionAccount')}</SectionTitle>
        <InsetList>{accountRows}</InsetList>
      </View>

      {privacyRows.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>{t('main.sectionPrivacy')}</SectionTitle>
          <InsetList>
            {privacyRows.map(([key, url], index) => (
              <InsetRow
                key={key}
                label={t(`main.${key}`)}
                onPress={() => openUrl(url)}
                last={index === privacyRows.length - 1}
                testID={`profile-${key}`}
              />
            ))}
          </InsetList>
        </View>
      )}

      <AppText variant="technical" style={styles.version}>
        {t('main.version', { version })}
      </AppText>
      {signingOut && <Note>{t('main.signingOut')}</Note>}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  identity: {
    alignItems: 'center',
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.12)',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  identityPlaceholder: { height: 240 },
  editButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16,22,15,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: palette.previewPaper,
    shadowColor: palette.base,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    backgroundColor: palette.structure,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { letterSpacing: -0.4, color: palette.cream },
  name: {
    marginTop: 14,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.84,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tags: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  tag: {
    minHeight: 28,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(16,22,15,0.06)',
    justifyContent: 'center',
  },
  tagStatus: { backgroundColor: 'rgba(43,58,36,0.12)' },
  tagText: { fontSize: 13, lineHeight: 17, letterSpacing: 0, color: palette.mutedCopy },
  tagStatusText: { color: palette.structure },
  premium: { marginTop: 28 },
  section: { marginTop: 32 },
  version: {
    marginTop: 32,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.44,
    color: palette.sage,
    textAlign: 'center',
  },
  devTools: { marginTop: 24 },
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
  pressed: { opacity: 0.72 },
  pressedDown: { transform: [{ translateY: 1 }] },
});
