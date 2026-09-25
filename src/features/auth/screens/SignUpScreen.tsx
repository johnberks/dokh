import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { supabase } from '@/data/supabase-client';
import { AuthAction, AuthField, AuthLightFrame, TextLink } from '@/features/auth/AuthVisuals';
import { authErrorMessage, signUpWithEmail } from '@/features/auth/email-auth';
import { type EmailCredentials, signUpSchema } from '@/features/auth/email-auth.schema';
import { palette } from '@/theme/tokens';

export default function SignUpScreen() {
  const { t } = useTranslation('auth');
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailCredentials>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  async function submit(values: EmailCredentials) {
    setServerError(null);
    try {
      const { session } = await signUpWithEmail(
        supabase,
        values.email,
        values.password,
        Linking.createURL('auth-callback'),
      );
      if (session) router.replace('/welcome');
      else setConfirmationSent(true);
    } catch (error) {
      setServerError(authErrorMessage(error, 'signUp'));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <AuthLightFrame title={t('signUp.headline')} subtitle={t('signUp.subtitle')}>
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <AuthField
                  label={t('common.email')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <AuthField
                  label={t('common.password')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  onSubmitEditing={() => void handleSubmit(submit)()}
                />
              )}
            />
            {serverError ? (
              <AppText accessibilityLiveRegion="polite" style={styles.feedbackError}>
                {serverError}
              </AppText>
            ) : null}
            {confirmationSent ? (
              <AppText accessibilityLiveRegion="polite" style={styles.feedback}>
                {t('signUp.confirmation')}
              </AppText>
            ) : null}
            <AuthAction
              label={t('signUp.submit')}
              loading={isSubmitting}
              onPress={() => void handleSubmit(submit)()}
            />
            <View style={styles.backRow}>
              <AppText style={styles.secondary}>{t('signUp.hasAccount')} </AppText>
              <TextLink label={t('signIn.title')} onPress={() => router.replace('/sign-in')} />
            </View>
          </View>
        </AuthLightFrame>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },
  scroll: { flexGrow: 1 },
  form: { gap: 12 },
  feedback: { fontSize: 13, lineHeight: 19, color: palette.structure },
  feedbackError: { fontSize: 13, lineHeight: 19, color: palette.negative },
  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingTop: 8,
  },
  secondary: { fontSize: 14, lineHeight: 20, color: palette.mutedCopy },
});
