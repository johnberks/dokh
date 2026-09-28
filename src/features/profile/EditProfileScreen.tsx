import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { LoadError, MutationError } from '@/components/TechnicalStates';
import { searchResidencyPrograms } from '@/domain/medical-specialties';
import { DarkButton } from '@/features/work/form/FormPieces';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import {
  DropdownField,
  InsetList,
  InsetRow,
  Note,
  ProfileIcon,
  SubScreen,
  TextField,
} from './ProfilePieces';
import { Avatar } from './ProfileScreen';
import {
  needsSpecialty,
  type ProfessionalStatus,
  type Profile,
  useActiveResidency,
  useProfile,
  useRemoveAvatar,
  useReplaceAvatar,
  useUpdateProfile,
} from './profile-data';

const MIN_GRADUATION_YEAR = 1950;
/** Poucas sugestões: a lista fica logo abaixo do campo, sem empurrar a cidade para longe. */
const SPECIALTY_SUGGESTIONS = 4;

/** Ano de graduação: vazio é permitido; preenchido, precisa ser um ano plausível. */
export function parseGraduationYear(value: string, currentYear: number): number | null | 'invalid' {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!/^\d{4}$/u.test(trimmed)) return 'invalid';
  const year = Number(trimmed);
  return year >= MIN_GRADUATION_YEAR && year <= currentYear ? year : 'invalid';
}

/**
 * Perfil 02: foto ou iniciais com `Alterar foto`, nome, ano de graduação, situação profissional
 * (Em residência/Generalista/Especialista, 11.10), especialidade para residente e especialista
 * e cidade. Sem gênero, sem CRM.
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
  const residency = useActiveResidency();
  const [name, setName] = useState(profile.displayName);
  const [graduation, setGraduation] = useState(
    profile.graduationYear === null ? '' : String(profile.graduationYear),
  );
  const [status, setStatus] = useState<ProfessionalStatus>(profile.status);
  const [specialty, setSpecialty] = useState(profile.specialty ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [specialtyPicked, setSpecialtyPicked] = useState(true);
  const suggestions = useMemo(
    () => (specialtyPicked ? [] : searchResidencyPrograms(specialty, SPECIALTY_SUGGESTIONS)),
    [specialty, specialtyPicked],
  );
  const currentYear = new Date().getFullYear();
  const year = parseGraduationYear(graduation, currentYear);
  const ready =
    name.trim() !== '' &&
    year !== 'invalid' &&
    (!needsSpecialty(status) || specialty.trim() !== '');
  // Sair de `Em residência` encerra a residência ativa no servidor: pede confirmação antes.
  const leavesResidency =
    profile.status === 'resident' && status !== 'resident' && residency.data != null;
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

  function persist() {
    if (!ready) return;
    update.mutate(
      { displayName: name, graduationYear: year, status, specialty, city },
      {
        onSuccess: () => {
          setConfirmingLeave(false);
          router.back();
        },
      },
    );
  }

  function save() {
    if (!ready) return;
    if (leavesResidency) {
      setConfirmingLeave(true);
      return;
    }
    persist();
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
        <DropdownField
          label={t('edit.status')}
          options={[
            { value: 'resident', label: t('edit.resident'), description: t('edit.residentHint') },
            {
              value: 'general_practitioner',
              label: t('edit.generalist'),
              description: t('edit.generalistHint'),
            },
            {
              value: 'specialist',
              label: t('edit.specialist'),
              description: t('edit.specialistHint'),
            },
          ]}
          value={status}
          onChange={setStatus}
          testID="profile-edit-status"
        />
        {needsSpecialty(status) && (
          <TextField
            label={status === 'resident' ? t('edit.residencyProgram') : t('edit.specialty')}
            value={specialty}
            onChangeText={(value) => {
              setSpecialty(value);
              setSpecialtyPicked(false);
            }}
            placeholder={
              status === 'resident'
                ? t('edit.residencyProgramPlaceholder')
                : t('edit.specialtyPlaceholder')
            }
            autoCapitalize="words"
            testID="profile-edit-specialty"
          />
        )}
        {needsSpecialty(status) && suggestions.length > 0 && (
          <InsetList grouped testID="profile-edit-specialty-suggestions">
            {suggestions.map((option, index) => (
              <InsetRow
                key={option.name}
                label={option.name}
                onPress={() => {
                  setSpecialty(option.name);
                  setSpecialtyPicked(true);
                }}
                last={index === suggestions.length - 1}
                testID={`profile-edit-specialty-option-${option.name}`}
              />
            ))}
          </InsetList>
        )}
        {/* Os dados próprios da residência (bolsa, datas) continuam na tela Residência. */}
        {status === 'resident' && profile.status === 'resident' && (
          <InsetList grouped>
            <InsetRow
              icon={<ProfileIcon name="residency" />}
              label={t('edit.residencyData')}
              subtitle={t('edit.residencyDataHint')}
              onPress={() => router.push('/profile/residency')}
              last
              testID="profile-edit-residency-data"
            />
          </InsetList>
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
      {update.isError && !confirmingLeave && (
        <MutationError onRetry={save} retrying={update.isPending} />
      )}
      <BottomSheet
        open={confirmingLeave}
        onClose={() => {
          if (!update.isPending) setConfirmingLeave(false);
        }}
        accessibilityLabel={t('edit.leaveTitle')}
        testID="profile-edit-leave-sheet"
      >
        <View style={styles.sheetCopy}>
          <AppText accessibilityRole="header" style={[type.heading1, styles.sheetTitle]}>
            {t('edit.leaveTitle')}
          </AppText>
          <AppText style={styles.sheetText}>{t('edit.leaveText')}</AppText>
        </View>
        {update.isError && <MutationError onRetry={persist} retrying={update.isPending} />}
        <DarkButton
          label={t('edit.leaveConfirm')}
          loading={update.isPending}
          onPress={persist}
          testID="profile-edit-leave-confirm"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('edit.cancel')}
          disabled={update.isPending}
          onPress={() => setConfirmingLeave(false)}
          style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.textButtonLabel]}>{t('edit.cancel')}</AppText>
        </Pressable>
      </BottomSheet>
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
  sheetCopy: { gap: 8, paddingTop: 6 },
  sheetTitle: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: colors.textPrimary },
  sheetText: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  pressed: { opacity: 0.72 },
});
