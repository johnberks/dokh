import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { z } from 'zod';
import { AppText } from '@/components/AppText';
import { supabase } from '@/data/supabase-client';
import { AuthAction, AuthField, AuthLightFrame, TextLink } from '@/features/auth/AuthVisuals';
import {
  acceptEmailLink,
  authErrorMessage,
  matchesAuthRedirect,
  updatePassword,
} from '@/features/auth/email-auth';
import { resetPasswordSchema } from '@/features/auth/email-auth.schema';
import { palette } from '@/theme/tokens';

type ResetFields = z.infer<typeof resetPasswordSchema>;
type LinkState = 'invalid' | 'verifying' | 'ready';

export default function ResetPasswordScreen() {
  const { t } = useTranslation('auth');
  const url = Linking.useLinkingURL();
  const processing = useRef<{ url: string; promise: Promise<void> } | null>(null);
  const [linkState, setLinkState] = useState<LinkState>('invalid');
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '' },
  });

  useEffect(() => {
    if (!url || !matchesAuthRedirect(url, Linking.createURL('reset-password'))) return;
    if (processing.current?.url !== url) {
      processing.current = { url, promise: acceptEmailLink(supabase, url, ['recovery']) };
    }
    let active = true;
    setLinkState('verifying');
    void processing.current.promise
      .then(() => {
        if (active) setLinkState('ready');
      })
      .catch(() => {
        if (active) setLinkState('invalid');
      });
    return () => {
      active = false;
    };
  }, [url]);

  async function submit(values: ResetFields) {
    setServerError(null);
    try {
      await updatePassword(supabase, values.password);
      router.replace('/');
    } catch (error) {
      setServerError(authErrorMessage(error, 'reset'));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <AuthLightFrame title={t('reset.headline')}>
          {linkState === 'ready' ? (
            <View style={styles.form}>
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
                <AppText accessibilityLiveRegion="polite" style={styles.error}>
                  {serverError}
                </AppText>
              ) : null}
              <AuthAction
                label={t('reset.submit')}
                loading={isSubmitting}
                onPress={() => void handleSubmit(submit)()}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <AppText accessibilityLiveRegion="polite" style={styles.feedback}>
                {linkState === 'verifying' ? t('reset.verifying') : t('reset.invalidLink')}
              </AppText>
              {linkState === 'invalid' ? (
                <TextLink
                  label={t('signIn.forgotten')}
                  onPress={() => router.replace('/recover-password')}
                />
              ) : null}
            </View>
          )}
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
  feedback: { fontSize: 13, lineHeight: 19, color: palette.mutedCopy },
});
