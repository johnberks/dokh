import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { supabase } from '@/data/supabase-client';
import { AuthLightFrame, TextLink } from '@/features/auth/AuthVisuals';
import { acceptEmailLink, matchesAuthRedirect } from '@/features/auth/email-auth';
import { palette } from '@/theme/tokens';

export default function AuthCallbackScreen() {
  const { t } = useTranslation('auth');
  const url = Linking.useLinkingURL();
  const processing = useRef<{ url: string; promise: Promise<void> } | null>(null);
  const [failed, setFailed] = useState(!url);

  useEffect(() => {
    if (!url || !matchesAuthRedirect(url, Linking.createURL('auth-callback'))) {
      setFailed(true);
      return;
    }
    setFailed(false);
    if (processing.current?.url !== url) {
      processing.current = { url, promise: acceptEmailLink(supabase, url, ['signup', 'email']) };
    }
    let active = true;
    void processing.current.promise
      .then(() => {
        if (active) router.replace('/welcome');
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [url]);

  return (
    <AuthLightFrame title={t('callback.title')}>
      <View style={styles.content}>
        <AppText accessibilityLiveRegion="polite" style={styles.message}>
          {failed ? t('callback.invalidLink') : t('callback.verifying')}
        </AppText>
        {failed ? (
          <TextLink label={t('signIn.title')} onPress={() => router.replace('/sign-in')} />
        ) : null}
      </View>
    </AuthLightFrame>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  message: { fontSize: 13, lineHeight: 19, color: palette.mutedCopy },
});
