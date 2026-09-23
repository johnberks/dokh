import { BlurTargetView, BlurView } from 'expo-blur';
import { Eye, EyeOff } from 'lucide-react-native';
import { type ReactNode, useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';

function BrandMark({ light = false, size = 40 }: { light?: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityElementsHidden>
      <Rect
        x={14}
        y={14}
        width={62}
        height={62}
        rx={10}
        fill={light ? palette.cream : palette.base}
      />
      <Rect x={44} y={44} width={62} height={62} rx={10} fill={palette.sage} />
      <Rect x={44} y={44} width={32} height={32} fill={palette.bronze} />
    </Svg>
  );
}

export function AuthWordmark({
  light = false,
  large = false,
}: {
  light?: boolean;
  large?: boolean;
}) {
  const { t } = useTranslation('auth');
  const type = useBrandTypography();
  return (
    <View style={styles.wordmark} accessible accessibilityLabel={t('common.brand')}>
      <BrandMark light={light} size={large ? 40 : 22} />
      <AppText
        style={[
          type.wordmark,
          {
            fontSize: large ? 18 : 12,
            lineHeight: large ? 20 : 14,
            color: light ? palette.cream : palette.base,
          },
        ]}
      >
        {t('common.brand')}
      </AppText>
    </View>
  );
}

/** The 270-point, blurred dark panel of onboarding.html screen 05B. */
export function SignInHero() {
  const targetRef = useRef<View | null>(null);
  return (
    <View style={styles.hero}>
      <BlurTargetView ref={targetRef} style={StyleSheet.absoluteFill}>
        <View style={styles.heroShapeLeft} />
        <View style={styles.heroShapeBottom} />
        <View style={styles.heroShapeSage} />
        <View style={styles.heroShapeOutline} />
        <View style={styles.heroBronze} />
      </BlurTargetView>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurTarget={targetRef}
        blurMethod="dimezisBlurViewSdk31Plus"
        intensity={40}
        tint="dark"
        pointerEvents="none"
      />
      <View style={styles.heroWordmark}>
        <AuthWordmark light large />
      </View>
    </View>
  );
}

function AppleIcon() {
  return (
    <Svg width={16} height={18} viewBox="0 0 814 1000" accessibilityElementsHidden>
      <Path
        fill={palette.base}
        d="M788 341c-6 5-109 63-109 193 0 151 132 204 136 205-1 3-21 72-70 143-43 62-89 124-158 124-68 0-90-42-169-42-77 0-105 43-170 43-64 0-110-64-155-127C56 800 0 660 0 526c0-214 139-328 276-328 73 0 133 48 179 48 44 0 112-51 195-51 32 0 145 3 220 110zM554 162c33-39 56-93 56-147 0-8-1-15-2-21-53 2-117 36-155 80-30 34-58 88-58 143 0 8 2 16 3 19 3 1 9 1 14 1 48 0 108-32 142-75z"
      />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 48 48" accessibilityElementsHidden>
      <Path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z"
      />
      <Path
        fill="#FBBC05"
        d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.6-5.9c-2.1 1.4-4.8 2.3-8 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </Svg>
  );
}

export function SocialChoices() {
  const { t } = useTranslation('auth');
  const type = useBrandTypography();
  return (
    <View style={styles.socialChoices}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={t('signIn.apple')}
        accessibilityHint={t('signIn.socialUnavailable')}
        style={styles.socialButton}
      >
        <AppleIcon />
        <AppText style={[type.heading2, styles.socialLabel]}>{t('signIn.apple')}</AppText>
      </View>
      <View
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={t('signIn.google')}
        accessibilityHint={t('signIn.socialUnavailable')}
        style={styles.socialButton}
      >
        <GoogleIcon />
        <AppText style={[type.heading2, styles.socialLabel]}>{t('signIn.google')}</AppText>
      </View>
      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <AppText style={styles.orText}>{t('common.or')}</AppText>
        <View style={styles.orLine} />
      </View>
    </View>
  );
}

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AuthField({ label, error, style, secureTextEntry, ...props }: AuthFieldProps) {
  const type = useBrandTypography();
  const { t } = useTranslation('auth');
  const [passwordVisible, setPasswordVisible] = useState(false);
  // Single-line TextInput on iOS clips focused glyphs when given a lineHeight or fixed height.
  const inputTypography = { fontFamily: type.body.fontFamily, fontWeight: type.body.fontWeight };
  return (
    <View>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        <AppText style={[type.technical, styles.fieldLabel]}>{label.toUpperCase()}</AppText>
        <TextInput
          {...props}
          secureTextEntry={Boolean(secureTextEntry && !passwordVisible)}
          accessibilityLabel={label}
          accessibilityHint={error}
          autoCapitalize="none"
          placeholderTextColor={palette.sage}
          style={[
            inputTypography,
            styles.fieldInput,
            secureTextEntry && styles.passwordInput,
            style,
          ]}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(passwordVisible ? 'common.hidePassword' : 'common.showPassword')}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.passwordToggle}
          >
            {passwordVisible ? (
              <EyeOff size={20} color={palette.sage} />
            ) : (
              <Eye size={20} color={palette.sage} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText accessibilityLiveRegion="polite" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function AuthAction({
  label,
  onPress,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const type = useBrandTypography();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && !loading ? styles.pressed : null]}
    >
      {loading ? <ActivityIndicator color={palette.cream} /> : null}
      <AppText style={[type.heading1, styles.actionLabel]}>{label}</AppText>
    </Pressable>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  const type = useBrandTypography();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8}>
      <AppText style={[type.heading1, styles.textLink]}>{label}</AppText>
    </Pressable>
  );
}

/** Neutral shell for email workflows not depicted in the design document. */
export function AuthLightFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const insets = useContext(SafeAreaInsetsContext);
  const type = useBrandTypography();
  return (
    <View
      style={[
        styles.lightFrame,
        { paddingTop: (insets?.top ?? 0) + 22, paddingBottom: Math.max(insets?.bottom ?? 0, 24) },
      ]}
    >
      <AuthWordmark />
      <View style={styles.lightHeading}>
        <AppText accessibilityRole="header" style={[type.heading1, styles.lightTitle]}>
          {title}
        </AppText>
        {subtitle ? <AppText style={styles.lightSubtitle}>{subtitle}</AppText> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hero: { height: 270, backgroundColor: palette.base, overflow: 'hidden' },
  heroShapeLeft: {
    position: 'absolute',
    left: -90,
    top: 70,
    width: 300,
    height: 300,
    borderRadius: 52,
    backgroundColor: palette.authHeroShade,
  },
  heroShapeBottom: {
    position: 'absolute',
    left: 60,
    top: 190,
    width: 300,
    height: 300,
    borderRadius: 52,
    backgroundColor: palette.structure,
    opacity: 0.85,
  },
  heroShapeSage: {
    position: 'absolute',
    left: 60,
    top: 190,
    width: 150,
    height: 150,
    backgroundColor: palette.workSage,
    opacity: 0.5,
  },
  heroShapeOutline: {
    position: 'absolute',
    right: -100,
    top: -110,
    width: 240,
    height: 240,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: palette.structure,
  },
  heroBronze: {
    position: 'absolute',
    right: 32,
    top: 104,
    width: 8,
    height: 8,
    backgroundColor: palette.bronze,
  },
  heroWordmark: { position: 'absolute', left: 32, bottom: 36 },
  socialChoices: { gap: 10 },
  socialButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.authFieldBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialLabel: { fontSize: 15, lineHeight: 20, letterSpacing: 0, color: palette.base },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 2 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.authDivider },
  orText: { fontSize: 13, lineHeight: 18, color: palette.sage },
  field: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.authFieldBorder,
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 2,
  },
  fieldError: { borderColor: palette.negative },
  fieldLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.sage },
  fieldInput: {
    padding: 0,
    fontSize: 15,
    color: palette.base,
  },
  passwordInput: { paddingRight: 42 },
  passwordToggle: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { marginTop: 4, fontSize: 12, lineHeight: 18, color: palette.negative },
  action: {
    height: 50,
    borderRadius: 14,
    backgroundColor: palette.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionLabel: { fontSize: 15, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  pressed: { opacity: 0.72 },
  textLink: { fontSize: 14, lineHeight: 20, letterSpacing: 0, color: palette.base },
  lightFrame: { flexGrow: 1, paddingHorizontal: 32, backgroundColor: palette.cream },
  lightHeading: { paddingTop: 36, paddingBottom: 28, gap: 12 },
  lightTitle: { fontSize: 32, lineHeight: 35, letterSpacing: -0.96, color: palette.base },
  lightSubtitle: { fontSize: 15, lineHeight: 23, color: palette.mutedCopy },
});
