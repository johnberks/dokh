import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { Illustration } from '@/components/Illustration';
import { useGuideTour } from '@/features/guide/guide-tour';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { useNotificationPermission } from './notification-permission';

/** Só um estado de interface do aparelho (D20 permite): o convite já foi respondido. */
const ANSWERED_KEY = 'dokh.notifications.prompt-answered';
/** Espera a tela assentar antes de abrir a folha. */
const SETTLE_MS = 1200;

/**
 * Convite antes da permissão do sistema (referências Mobbin: Givingli, Remote): explica o que a
 * DOKH avisa e só então o iPhone pergunta. Aparece uma vez, com a permissão ainda não pedida e
 * fora do guia de primeiro uso. "Agora não" não volta a insistir; dá para ativar no Perfil.
 */
export function NotificationPrompt() {
  const { t } = useTranslation('notifications');
  const type = useBrandTypography();
  const permission = useNotificationPermission((store) => store.state);
  const touring = useGuideTour((store) => store.step !== null);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(ANSWERED_KEY)
      .then((value) => {
        if (active) setAnswered(value === 'yes');
      })
      .catch(() => {
        if (active) setAnswered(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (answered !== false || permission !== 'undetermined' || touring) return;
    const timer = setTimeout(() => setOpen(true), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [answered, permission, touring]);

  function finish() {
    setOpen(false);
    setAnswered(true);
    void SecureStore.setItemAsync(ANSWERED_KEY, 'yes').catch(() => undefined);
  }

  return (
    <BottomSheet
      open={open}
      onClose={finish}
      accessibilityLabel={t('prompt.title')}
      testID="notification-prompt"
    >
      <View style={styles.art}>
        <Illustration name="paymentPending" width={120} ground={false} />
      </View>
      <View style={styles.copy}>
        <AppText variant="technical" style={styles.eyebrow}>
          {t('prompt.eyebrow')}
        </AppText>
        <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
          {t('prompt.title')}
        </AppText>
        <AppText style={styles.text}>{t('prompt.text')}</AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('prompt.allow')}
        onPress={() => {
          finish();
          void useNotificationPermission.getState().request();
        }}
        testID="notification-prompt-allow"
        style={({ pressed }) => [styles.allow, pressed && styles.pressed]}
      >
        <AppText style={[type.heading1, styles.allowText]}>{t('prompt.allow')}</AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('prompt.later')}
        onPress={finish}
        testID="notification-prompt-later"
        style={({ pressed }) => [styles.later, pressed && styles.pressed]}
      >
        <AppText style={[type.heading1, styles.laterText]}>{t('prompt.later')}</AppText>
      </Pressable>
      <AppText style={styles.note}>{t('prompt.note')}</AppText>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  art: { alignItems: 'center', paddingTop: 4 },
  copy: { gap: 8 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  title: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: colors.textPrimary },
  text: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
  allow: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowText: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  later: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  laterText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  note: { fontSize: 12, lineHeight: 17, color: palette.sage, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
