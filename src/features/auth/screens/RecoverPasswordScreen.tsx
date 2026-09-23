import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { z } from 'zod';
import { AppText } from '@/components/AppText';
import { supabase } from '@/data/supabase-client';
import { AuthAction, AuthField, AuthLightFrame, TextLink } from '@/features/auth/AuthVisuals';
import { authErrorMessage, sendRecoveryEmail } from '@/features/auth/email-auth';
import { recoverySchema } from '@/features/auth/email-auth.schema';
import { palette } from '@/theme/tokens';

type RecoveryFields = z.infer<typeof recoverySchema>;

export default function RecoverPasswordScreen() {
  const { t } = useTranslation('auth');
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryFields>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: '' },
  });

  async function submit(values: RecoveryFields) {
    setServerError(null);
    try {
      await sendRecoveryEmail(supabase, values.email, Linking.createURL('reset-password'));
      setSent(true);
    } catch (error) {
      setServerError(authErrorMessage(error, 'recover'));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <AuthLightFrame title={t('recover.headline')} subtitle={t('recover.explanation')}>
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
                  onSubmitEditing={() => void handleSubmit(submit)()}
                />
              )}
            />
            {serverError ? (
              <AppText accessibilityLiveRegion="polite" style={styles.error}>
                {serverError}
              </AppText>
            ) : null}
            {sent ? (
              <AppText accessibilityLiveRegion="polite" style={styles.feedback}>
                {t('recover.sent')}
              </AppText>
            ) : null}
            <AuthAction
              label={t('recover.submit')}
              loading={isSubmitting}
              onPress={() => void handleSubmit(submit)()}
            />
            <View style={styles.back}>
              <TextLink label={t('common.back')} onPress={() => router.replace('/sign-in')} />
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
  error: { fontSize: 13, lineHeight: 19, color: palette.negative },
  feedback: { fontSize: 13, lineHeight: 19, color: palette.structure },
  back: { alignItems: 'center', paddingTop: 8 },
});
