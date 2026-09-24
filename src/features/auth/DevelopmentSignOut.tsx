import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useAuthSession } from './AuthSessionProvider';

/** Temporary sign-out entry point while the Profile/onboarding screens are placeholders. */
export function DevelopmentSignOut() {
  const { t } = useTranslation('auth');
  const { signOut } = useAuthSession();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!__DEV__) return null;

  async function onPress() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await signOut();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <>
      <Button label={t('common.signOut')} disabled={busy} onPress={() => void onPress()} />
      {failed ? (
        <AppText accessibilityLiveRegion="polite">{t('common.signOutError')}</AppText>
      ) : null}
    </>
  );
}
