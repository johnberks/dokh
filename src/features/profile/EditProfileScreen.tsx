import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { LoadError, MutationError } from '@/components/TechnicalStates';
import { DarkButton } from '@/features/work/form/FormPieces';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { ChoiceChips, FieldLabel, Note, SubScreen, TextField } from './ProfilePieces';
import { Avatar } from './ProfileScreen';
import {
  type ProfessionalStatus,
  type Profile,
  useProfile,
  useRemoveAvatar,
  useReplaceAvatar,
  useUpdateProfile,
} from './profile-data';

const MIN_GRADUATION_YEAR = 1950;

/** Ano de graduação: vazio é permitido; preenchido, precisa ser um ano plausível. */
export function parseGraduationYear(value: string, currentYear: number): number | null | 'invalid' {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!/^\d{4}$/u.test(trimmed)) return 'invalid';
  const year = Number(trimmed);
  return year >= MIN_GRADUATION_YEAR && year <= currentYear ? year : 'invalid';
}

/**
 * Perfil 02: foto ou iniciais com `Alterar foto`, nome, ano de graduação, situação
 * (Generalista/Residência), especialidade só com Residência e cidade. Sem gênero, sem CRM.
 */
export function EditProfileScreen() {
  const { t } = useTranslation('profile');
  const profile = useProfile();

  if (profile.data) return <EditProfileForm profile={profile.data} />;
  return (
    <SubScreen title={t('edit.title')} onBack={() => router.back()} testID="profile-edit-screen">
      {profile.isError ? (
        <LoadError onRetry={() => void profile.refetch()} retrying={profile.isFetching} />
      ) : (
        <ActivityIndicator color={palette.sage} style={styles.loading} />
      )}
    </SubScreen>
  );
}

function EditProfileForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation('profile');
  const type = useBrandTypography();
  const update = useUpdateProfile();
  const replace = useReplaceAvatar();
  const remove = useRemoveAvatar();
  const [name, setName] = useState(profile.displayName);
  const [graduation, setGraduation] = useState(
    profile.graduationYear === null ? '' : String(profile.graduationYear),
  );
  const [status, setStatus] = useState<ProfessionalStatus>(profile.status);
  const [specialty, setSpecialty] = useState(profile.specialty ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const year = parseGraduationYear(graduation, currentYear);
  const ready =
    name.trim() !== '' &&
    year !== 'invalid' &&
    (status === 'general_practitioner' || specialty.trim() !== '');
  const photoBusy = replace.isPending || remove.isPending;

  async function pickPhoto() {
    setPhotoMessage(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoMessage(t('edit.photoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    replace.mutate(
      {
        file: {
          uri: asset.uri,
          mimeType: asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
        },
        previousPath: profile.avatarPath,
      },
      { onError: () => setPhotoMessage(t('edit.photoError')) },
    );
  }

  function save() {
    if (!ready) return;
    update.mutate(
      { displayName: name, graduationYear: year, status, specialty, city },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <SubScreen
      title={t('edit.title')}
      onBack={() => router.back()}
      testID="profile-edit-screen"
      footer={
        <DarkButton
          label={t('edit.save')}
          disabled={!ready}
          loading={update.isPending}
          onPress={save}
          testID="profile-edit-save"
        />
      }
    >
      <View style={styles.photo}>
        <Avatar profile={profile} size={88} />
        <View style={styles.photoActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('edit.changePhoto')}
            accessibilityState={{ busy: photoBusy, disabled: photoBusy }}
            disabled={photoBusy}
            hitSlop={8}
            onPress={() => void pickPhoto()}
            testID="profile-photo-change"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <AppText style={[type.heading1, styles.photoAction]}>{t('edit.changePhoto')}</AppText>
          </Pressable>
          {profile.avatarPath && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('edit.removePhoto')}
              disabled={photoBusy}
              hitSlop={8}
              onPress={() =>
                profile.avatarPath &&
                remove.mutate(profile.avatarPath, {
                  onError: () => setPhotoMessage(t('edit.photoError')),
                })
              }
              testID="profile-photo-remove"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <AppText style={styles.photoRemove}>{t('edit.removePhoto')}</AppText>
            </Pressable>
          )}
        </View>
        {photoBusy && <ActivityIndicator color={palette.sage} />}
        {photoMessage && <Note testID="profile-photo-message">{photoMessage}</Note>}
      </View>

      <View style={styles.fields}>
        <TextField
          label={t('edit.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('edit.namePlaceholder')}
          autoCapitalize="words"
          testID="profile-edit-name"
        />
        <TextField
          label={t('edit.graduation')}
          value={graduation}
          onChangeText={(value) => setGraduation(value.replace(/\D/gu, '').slice(0, 4))}
          placeholder={t('edit.graduationPlaceholder')}
          keyboardType="number-pad"
          maxLength={4}
          testID="profile-edit-graduation"
        />
        {year === 'invalid' && graduation.length === 4 && (
          <Note testID="profile-edit-graduation-error">
            {t('edit.graduationInvalid', { year: currentYear })}
          </Note>
        )}
        <View style={styles.statusBlock}>
          <FieldLabel>{t('edit.status')}</FieldLabel>
          <ChoiceChips
            label={t('edit.status')}
            options={[
              { value: 'general_practitioner', label: t('edit.generalist') },
              { value: 'resident', label: t('edit.resident') },
            ]}
            value={status}
            onChange={setStatus}
            testID="profile-edit-status"
          />
        </View>
        {status === 'resident' && (
          <TextField
            label={t('edit.specialty')}
            value={specialty}
            onChangeText={setSpecialty}
            placeholder={t('edit.specialtyPlaceholder')}
            autoCapitalize="words"
            testID="profile-edit-specialty"
          />
        )}
        <TextField
          label={t('edit.city')}
          value={city}
          onChangeText={setCity}
          placeholder={t('edit.cityPlaceholder')}
          autoCapitalize="words"
          testID="profile-edit-city"
        />
      </View>
      {update.isError && <MutationError onRetry={save} retrying={update.isPending} />}
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 32 },
  photo: { alignItems: 'center', gap: 12 },
  photoActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  photoAction: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  photoRemove: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  fields: { marginTop: 28, gap: 10 },
  statusBlock: { gap: 10, paddingTop: 6, paddingBottom: 6 },
  pressed: { opacity: 0.72 },
});
