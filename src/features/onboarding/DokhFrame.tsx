import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, motion, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';

/**
 * A moldura da DOKH da pessoa (Onboarding v2, 7.7): nasce vazia na tela de Nome e ganha o nome
 * enquanto se digita. É o lugar onde as próximas peças (residência, trabalho) vão se encaixar.
 */
export function DokhFrame({ name, testID = 'dokh-frame' }: { name: string; testID?: string }) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const reduced = useReducedMotion();
  const trimmed = name.trim();
  const label = trimmed ? t('profile.frame.named', { name: trimmed }) : t('profile.frame.empty');

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.frame, trimmed !== '' && styles.frameFilled]}
      testID={testID}
    >
      <BrandMark size={16} />
      <Animated.View
        // Troca curta a cada letra seria ruído: anima só quando o nome aparece ou some.
        key={trimmed === '' ? 'empty' : 'named'}
        entering={reduced ? undefined : FadeIn.duration(motion.enter)}
        style={styles.textBox}
      >
        <AppText numberOfLines={1} style={[type.heading1, styles.text]} testID={`${testID}-label`}>
          {label}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    minHeight: 44,
    maxWidth: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(16,22,15,0.28)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  frameFilled: { borderStyle: 'solid', borderColor: colors.foreground },
  textBox: { flexShrink: 1 },
  text: { fontSize: 15, lineHeight: 19, letterSpacing: -0.15, color: palette.base },
});
