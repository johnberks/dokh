import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from '@/components/AppText';
import { supabase } from '@/data/supabase-client';
import {
  AuthAction,
  AuthField,
  SignInHero,
  SocialChoices,
  TextLink,
} from '@/features/auth/AuthVisuals';
import { authErrorMessage, signInWithEmail } from '@/features/auth/email-auth';
import { type EmailCredentials, signInSchema } from '@/features/auth/email-auth.schema';
import { revealFocusedField } from '@/features/auth/keyboard-scroll';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { palette } from '@/theme/tokens';

export default function SignInScreen() {
  const { t } = useTranslation('auth');
  const type = useBrandTypography();
  const [serverError, setServerError] = useState<string | null>(null);
  const keyboardVisible = useRef(false);
  const viewportRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const emailFieldRef = useRef<View>(null);
  const passwordFieldRef = useRef<View>(null);
  const focusedField = useRef<'email' | 'password' | null>(null);
  const scrollOffset = useRef(0);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailCredentials>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const revealActiveField = useCallback(() => {
    const scroll = scrollRef.current;
    const viewport = viewportRef.current;
    const field =
      focusedField.current === 'email' ? emailFieldRef.current : passwordFieldRef.current;
    if (!scroll || !viewport || !field || !focusedField.current) return;

    revealFocusedField(viewport, field, scroll, () => scrollOffset.current);
  }, []);

  const scheduleReveal = useCallback(() => {
    requestAnimationFrame(revealActiveField);
  }, [revealActiveField]);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      keyboardVisible.current = true;
      scheduleReveal();
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisible.current = false;
      scrollOffset.current = 0;
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    const frame =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardDidChangeFrame', () => {
            if (keyboardVisible.current) scheduleReveal();
          })
        : null;
    return () => {
      shown.remove();
      hidden.remove();
      frame?.remove();
    };
  }, [scheduleReveal]);

  function focusField(field: 'email' | 'password') {
    focusedField.current = field;
    if (keyboardVisible.current) scheduleReveal();
  }

  async function submit(values: EmailCredentials) {
    setServerError(null);
    try {
      await signInWithEmail(supabase, values.email, values.password);
      router.replace('/');
    } catch (error) {
      setServerError(authErrorMessage(error, 'signIn'));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <View
        ref={viewportRef}
        collapsable={false}
        style={styles.scrollView}
        onLayout={() => {
          if (keyboardVisible.current) scheduleReveal();
        }}
      >
        <ScrollView
          ref={scrollRef}
          testID="sign-in-scroll"
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          scrollEnabled={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            scrollOffset.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <SignInHero />
          <View style={styles.headlineBlock}>
            <AppText accessibilityRole="header" style={[type.heading1, styles.headline]}>
              {t('signIn.headline')}
            </AppText>
          </View>
          <View style={styles.content}>
            <SocialChoices />
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <AuthField
                  containerRef={emailFieldRef}
                  label={t('signIn.email')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  onFocus={() => focusField('email')}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <AuthField
                  containerRef={passwordFieldRef}
                  label={t('signIn.password')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  onFocus={() => focusField('password')}
                  error={errors.password?.message}
                  secureTextEntry
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSubmit(submit)()}
                />
              )}
            />
            <View style={styles.forgotten}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/recover-password')}
                hitSlop={8}
              >
                <AppText style={[type.heading2, styles.forgottenText]}>
                  {t('signIn.forgotten')}
                </AppText>
              </Pressable>
            </View>
            {serverError ? (
              <AppText accessibilityLiveRegion="polite" style={styles.serverError}>
                {serverError}
              </AppText>
            ) : null}
          </View>
          <View style={styles.spacer} />
          <View style={styles.footer}>
            <AuthAction
              label={t('signIn.submit')}
              loading={isSubmitting}
              onPress={() => void handleSubmit(submit)()}
            />
            <View style={styles.footerLink}>
              <AppText style={styles.footerCopy}>{t('signIn.noAccount')} </AppText>
              <TextLink label={t('signIn.create')} onPress={() => router.push('/sign-up')} />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1 },
  headlineBlock: { paddingTop: 36, paddingHorizontal: 32 },
  headline: { fontSize: 32, lineHeight: 35, letterSpacing: -0.96, color: palette.base },
  content: { paddingTop: 28, paddingHorizontal: 32, gap: 10 },
  forgotten: { alignItems: 'flex-end' },
  forgottenText: { fontSize: 13, lineHeight: 20, letterSpacing: 0, color: palette.mutedCopy },
  serverError: { fontSize: 13, lineHeight: 19, color: palette.negative },
  spacer: { flexGrow: 1, minHeight: 20 },
  footer: { paddingHorizontal: 32, paddingBottom: 44, gap: 14 },
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerCopy: { fontSize: 14, lineHeight: 20, color: palette.mutedCopy },
});
