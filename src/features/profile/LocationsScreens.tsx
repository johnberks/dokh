import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { PremiumBadge, PremiumLockIcon } from '@/components/PremiumBadge';
import { LoadError, MutationError } from '@/components/TechnicalStates';
import { queryKeys, workAffectedPrefixes } from '@/data/query-keys';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { usePremium } from '@/features/billing/entitlement';
import {
  FREE_COLOR_TOKENS,
  isFreeColorToken,
  nextAutomaticColorToken,
  PREMIUM_COLOR_TOKENS,
} from '@/features/locations/location-colors';
import {
  archiveWorkLocation,
  type ColorSource,
  createWorkLocation,
  updateWorkLocation,
  useWorkLocations,
  type WorkLocation,
} from '@/features/locations/locations-data';
import { DarkButton } from '@/features/work/form/FormPieces';
import { findLocationByName } from '@/features/work/form/LocationField';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette, type WorkLocationColorToken, workLocationColors } from '@/theme/tokens';
import { FieldLabel, Note, SubScreen, TextField } from './ProfilePieces';
import { useLocationWorkCounts } from './profile-data';

const EXTENDED_TOKENS: readonly WorkLocationColorToken[] = PREMIUM_COLOR_TOKENS.filter(
  (token) => !FREE_COLOR_TOKENS.includes(token),
);

function colorOf(token: string): string {
  return workLocationColors[token as WorkLocationColorToken] ?? palette.workSage;
}

function AddButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID="locations-add-header"
      style={({ pressed }) => [styles.addCircle, pressed && styles.pressed]}
    >
      <View style={styles.plusH} />
      <View style={styles.plusV} />
    </Pressable>
  );
}

/** Perfil 03 (lista com ponto, nome e contagem — nunca valores) e 03b (vazio tipográfico). */
export function LocationsScreen() {
  const { t } = useTranslation('profile');
  const type = useBrandTypography();
  const locations = useWorkLocations();
  const counts = useLocationWorkCounts();
  const list = locations.data ?? [];
  const openNew = () => router.push('/profile/locations/new');

  const countLabel = (id: string) => {
    const count = counts.data?.[id] ?? 0;
    if (count === 0) return t('locations.countNone');
    return count === 1 ? t('locations.countOne') : t('locations.countMany', { count });
  };

  return (
    <SubScreen
      title={t('locations.title')}
      onBack={() => router.back()}
      headerAction={
        list.length > 0 ? <AddButton label={t('locations.add')} onPress={openNew} /> : undefined
      }
      testID="locations-screen"
    >
      {locations.isPending ? (
        <ActivityIndicator color={palette.sage} style={styles.loading} />
      ) : locations.isError ? (
        <LoadError onRetry={() => void locations.refetch()} retrying={locations.isFetching} />
      ) : list.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            variant="profileLocations"
            onPrimaryPress={openNew}
            testID="locations-empty"
          />
        </View>
      ) : (
        <View style={styles.listBlock}>
          <AppText style={styles.description}>{t('locations.description')}</AppText>
          <View style={styles.list}>
            {list.map((location) => (
              <Pressable
                key={location.id}
                accessibilityRole="button"
                accessibilityLabel={`${location.name}, ${countLabel(location.id)}`}
                onPress={() =>
                  router.push({ pathname: '/profile/locations/[id]', params: { id: location.id } })
                }
                testID={`location-${location.id}`}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={[styles.dot, { backgroundColor: colorOf(location.colorToken) }]} />
                <View style={styles.cardText}>
                  <AppText numberOfLines={1} style={[type.heading1, styles.cardName]}>
                    {location.name}
                  </AppText>
                  <AppText style={styles.cardCount}>{countLabel(location.id)}</AppText>
                </View>
                <AppText style={styles.chevron}>{'›'}</AppText>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('locations.add')}
            onPress={openNew}
            testID="locations-add"
            style={({ pressed }) => [styles.dashed, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.dashedText]}>{t('locations.add')}</AppText>
            <AppText style={[type.heading1, styles.dashedPlus]}>{'+'}</AppText>
          </Pressable>
        </View>
      )}
    </SubScreen>
  );
}

function Swatch({
  token,
  selected,
  locked,
  label,
  onPress,
}: {
  token: WorkLocationColorToken;
  selected: boolean;
  locked: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled: locked }}
      disabled={locked}
      onPress={onPress}
      testID={`location-color-${token}`}
      style={({ pressed }) => [
        styles.swatchRing,
        selected && styles.swatchRingOn,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.swatch,
          { backgroundColor: workLocationColors[token] },
          locked && styles.swatchLocked,
        ]}
      >
        {locked && <PremiumLockIcon color={palette.cream} size={13} />}
      </View>
    </Pressable>
  );
}

/**
 * Perfil 04 (novo) e 04b (editar): nome obrigatório, cidade, cores livres e paleta ampliada
 * (Premium; no Free fica visível, explicada e bloqueada, sem impedir salvar). Remover arquiva
 * — os trabalhos já cadastrados continuam no histórico.
 */
export function LocationFormScreen({ locationId }: { locationId?: string }) {
  const { t } = useTranslation('profile');
  const locations = useWorkLocations();
  const current = locationId
    ? locations.data?.find((location) => location.id === locationId)
    : undefined;

  if (locationId && !current) {
    return (
      <SubScreen title={t('locations.editTitle')} onBack={() => router.back()}>
        {locations.isError ? (
          <LoadError onRetry={() => void locations.refetch()} retrying={locations.isFetching} />
        ) : (
          <ActivityIndicator color={palette.sage} style={styles.loading} />
        )}
      </SubScreen>
    );
  }
  return <LocationForm current={current} all={locations.data ?? []} />;
}

function LocationForm({ current, all }: { current?: WorkLocation; all: readonly WorkLocation[] }) {
  const { t } = useTranslation('profile');
  const { t: tAgenda } = useTranslation('agenda');
  const type = useBrandTypography();
  const { userId } = useAuthSession();
  const queryClient = useQueryClient();
  const premium = usePremium();
  const isPremium = premium.data === true;
  const editing = current !== undefined;
  const initialToken: WorkLocationColorToken =
    current && current.colorToken in workLocationColors
      ? (current.colorToken as WorkLocationColorToken)
      : nextAutomaticColorToken(all.map((location) => location.colorToken));
  const [name, setName] = useState(current?.name ?? '');
  const [city, setCity] = useState(current?.city ?? '');
  const [token, setToken] = useState<WorkLocationColorToken>(initialToken);
  const [colorTouched, setColorTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  const duplicate = findLocationByName(all, name);
  const isDuplicate = duplicate !== undefined && duplicate.id !== current?.id;
  const ready = name.trim() !== '' && !isDuplicate;

  function invalidate() {
    if (userId === null) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.workLocations(userId) });
    for (const prefix of workAffectedPrefixes) {
      void queryClient.invalidateQueries({ queryKey: [prefix, userId] });
    }
  }

  function sourceFor(next: WorkLocationColorToken): ColorSource {
    if (!colorTouched) return current?.colorSource ?? 'automatic';
    return isFreeColorToken(next) ? 'free_palette' : 'premium_palette';
  }

  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    setFailed(false);
    try {
      const colorSource = sourceFor(token);
      if (current) {
        await updateWorkLocation(current, { name, city, colorToken: token, colorSource });
      } else {
        await createWorkLocation({ name, city, colorToken: token, colorSource }, all);
      }
      invalidate();
      router.back();
    } catch {
      setFailed(true);
      setSaving(false);
    }
  }

  async function remove() {
    if (!current || removing) return;
    setRemoving(true);
    setFailed(false);
    try {
      await archiveWorkLocation(current.id);
      invalidate();
      setConfirming(false);
      router.back();
    } catch {
      setFailed(true);
      setRemoving(false);
    }
  }

  const pick = (next: WorkLocationColorToken) => {
    setToken(next);
    setColorTouched(true);
  };

  return (
    <SubScreen
      title={editing ? t('locations.editTitle') : t('locations.newTitle')}
      onBack={() => router.back()}
      testID="location-form"
      footer={
        <>
          <DarkButton
            label={editing ? t('locations.saveChanges') : t('locations.save')}
            disabled={!ready}
            loading={saving}
            onPress={() => void save()}
            testID="location-save"
          />
          {editing && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('locations.remove')}
              onPress={() => setConfirming(true)}
              testID="location-remove"
              style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
            >
              <AppText style={styles.removeText}>{t('locations.remove')}</AppText>
            </Pressable>
          )}
        </>
      }
    >
      <View style={styles.fields}>
        <TextField
          label={t('locations.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('locations.namePlaceholder')}
          autoCapitalize="words"
          testID="location-name"
        />
        {isDuplicate && <Note testID="location-duplicate">{t('locations.duplicate')}</Note>}
        <TextField
          label={t('locations.city')}
          value={city}
          onChangeText={setCity}
          placeholder={t('locations.cityPlaceholder')}
          autoCapitalize="words"
          testID="location-city"
        />
      </View>

      <View style={styles.colorBlock}>
        <FieldLabel>{t('locations.color')}</FieldLabel>
        <View accessibilityRole="radiogroup" style={styles.swatches}>
          {FREE_COLOR_TOKENS.map((option) => (
            <Swatch
              key={option}
              token={option}
              selected={token === option}
              locked={false}
              label={tAgenda(`form.colors.${option}`)}
              onPress={() => pick(option)}
            />
          ))}
        </View>
      </View>

      <View style={styles.colorBlock}>
        <View style={styles.extendedHeader}>
          <FieldLabel>{t('locations.extended')}</FieldLabel>
          {premium.isSuccess && !isPremium && <PremiumBadge size="short" />}
        </View>
        <View accessibilityRole="radiogroup" style={styles.swatches}>
          {EXTENDED_TOKENS.map((option) => {
            const colorName = tAgenda(`form.colors.${option}`);
            return (
              <Swatch
                key={option}
                token={option}
                selected={token === option}
                locked={!isPremium}
                label={isPremium ? colorName : t('locations.locked', { color: colorName })}
                onPress={() => pick(option)}
              />
            );
          })}
        </View>
        {premium.isSuccess && !isPremium && <Note>{t('locations.extendedHint')}</Note>}
      </View>

      {failed && (
        <MutationError onRetry={() => void (confirming ? remove() : save())} retrying={saving} />
      )}

      <BottomSheet
        open={confirming}
        onClose={() => {
          if (!removing) setConfirming(false);
        }}
        accessibilityLabel={t('locations.removeTitle', { name: current?.name ?? '' })}
        testID="location-remove-sheet"
      >
        <View style={styles.sheetCopy}>
          <AppText accessibilityRole="header" style={[type.heading1, styles.sheetTitle]}>
            {t('locations.removeTitle', { name: current?.name ?? '' })}
          </AppText>
          <AppText style={styles.sheetText}>{t('locations.removeText')}</AppText>
        </View>
        <DarkButton
          label={t('locations.removeConfirm')}
          loading={removing}
          onPress={() => void remove()}
          testID="location-remove-confirm"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('locations.cancel')}
          disabled={removing}
          onPress={() => setConfirming(false)}
          testID="location-remove-cancel"
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.cancelText]}>{t('locations.cancel')}</AppText>
        </Pressable>
      </BottomSheet>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 32 },
  empty: { flex: 1, justifyContent: 'center', paddingBottom: 80 },
  listBlock: { gap: 22 },
  description: { fontSize: 14, lineHeight: 21, color: palette.mutedCopy },
  list: { gap: 10 },
  card: {
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.16)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: palette.base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 2,
  },
  cardPressed: { transform: [{ translateY: 1 }], backgroundColor: '#F3F0E7' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cardText: { flex: 1, gap: 2 },
  cardName: { fontSize: 16, lineHeight: 20, letterSpacing: -0.16, color: colors.textPrimary },
  cardCount: { fontSize: 13, lineHeight: 17, color: palette.mutedCopy },
  chevron: { fontSize: 18, lineHeight: 22, color: palette.sage },
  dashed: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(16,22,15,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dashedText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  dashedPlus: { fontSize: 18, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusH: { position: 'absolute', width: 14, height: 2, backgroundColor: palette.bronze },
  plusV: { position: 'absolute', width: 2, height: 14, backgroundColor: palette.bronze },
  fields: { gap: 10 },
  colorBlock: { marginTop: 24, gap: 12 },
  extendedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swatches: { flexDirection: 'row', gap: 6, paddingHorizontal: 0 },
  swatchRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRingOn: { borderColor: colors.foreground },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLocked: { opacity: 0.45 },
  remove: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  cancelText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  sheetCopy: { gap: 8, paddingTop: 6 },
  sheetTitle: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: colors.textPrimary },
  sheetText: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
  pressed: { opacity: 0.72 },
});
