import { type ReactNode, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { NavigationControl } from '@/components/NavigationControl';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';

/** Ícones de linha do HTML do Perfil (viewBox 24, traço 1,7). */
export const PROFILE_ICONS = {
  pin: 'M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10zm0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  residency: 'M4 21V8l8-5 8 5v13H4zm4 0v-6h8v6M12 9v4M10 11h4',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9.5 12l2 2 3.5-4',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h0',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9L3.5 9.7l5.9-.8z',
  chat: 'M4 5h16v11H9l-5 4z',
  flag: 'M5 21V4h13l-2 4 2 4H5',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13',
  briefcase:
    'M3.5 9.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5',
  person: 'M12 12.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM5.5 20a6.5 6.5 0 0 1 13 0',
} as const;

export function ProfileIcon({
  name,
  size = 19,
  color = colors.foreground,
}: {
  name: keyof typeof PROFILE_ICONS;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
      <Path
        d={PROFILE_ICONS[name]}
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Subtela do Perfil (02–17): voltar em círculo + título, conteúdo rolando sem barra e, quando
 * existe, a ação principal fixa embaixo, acima do teclado.
 */
export function SubScreen({
  title,
  onBack,
  headerAction,
  footer,
  children,
  testID,
}: {
  title: string;
  onBack: () => void;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  testID?: string;
}) {
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID={testID}>
      <View style={styles.header}>
        <View style={styles.headerStart}>
          <NavigationControl kind="back" onPress={onBack} />
          <AppText
            accessibilityRole="header"
            numberOfLines={1}
            style={[type.heading1, styles.title]}
          >
            {title}
          </AppText>
        </View>
        {headerAction}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

/** Rótulo técnico de seção (9 pt) usado nos formulários do Perfil. */
export function FieldLabel({ children }: { children: string }) {
  return (
    <AppText variant="technical" style={styles.fieldLabel}>
      {children}
    </AppText>
  );
}

/** Campo de 60 com rótulo técnico e texto digitado (Perfil 02/04/06). */
export function TextField({
  label,
  testID,
  ...input
}: Omit<TextInputProps, 'style' | 'accessibilityLabel'> & { label: string; testID?: string }) {
  const type = useBrandTypography();
  const filled = typeof input.value === 'string' && input.value.trim() !== '';
  return (
    <View style={[styles.field, filled && styles.fieldFilled]}>
      <AppText variant="technical" style={styles.fieldTitle}>
        {label}
      </AppText>
      <TextInput
        {...input}
        accessibilityLabel={label}
        placeholderTextColor={palette.sage}
        style={[type.heading1, styles.input]}
        testID={testID}
      />
    </View>
  );
}

/** Chips lado a lado (situação profissional, duração, prazo): um escolhido por vez. */
export function ChoiceChips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  testID,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  testID?: string;
}) {
  const type = useBrandTypography();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.chips}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: on }}
            onPress={() => onChange(option.value)}
            testID={testID ? `${testID}-${option.value}` : undefined}
            style={({ pressed }) => [
              styles.chip,
              on ? styles.chipOn : styles.chipOff,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              numberOfLines={1}
              style={[on ? type.heading1 : null, styles.chipText, on && styles.chipTextOn]}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Lista agrupada clara (Perfil 15–17): linhas de 56 com divisor. */
export function InsetList({ children }: { children: ReactNode }) {
  return <View style={styles.inset}>{children}</View>;
}

export function InsetRow({
  label,
  value,
  icon,
  accessory,
  onPress,
  last = false,
  muted = false,
  testID,
}: {
  label: string;
  value?: string | null;
  icon?: ReactNode;
  accessory?: ReactNode;
  onPress?: () => void;
  last?: boolean;
  muted?: boolean;
  testID?: string;
}) {
  const content = (
    <>
      {icon}
      <AppText variant="heading2" style={[styles.insetLabel, muted && styles.insetMuted]}>
        {label}
      </AppText>
      {value ? (
        <AppText numberOfLines={1} style={styles.insetValue}>
          {value}
        </AppText>
      ) : null}
      {accessory ?? (onPress ? <AppText style={styles.chevron}>{'›'}</AppText> : null)}
    </>
  );
  const style = [styles.insetRow, !last && styles.insetDivider];
  if (!onPress) {
    return (
      <View
        accessible
        accessibilityLabel={value ? `${label}, ${value}` : label}
        style={style}
        testID={testID}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [...style, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

/** Selo neutro "EM BREVE" para o que ainda não existe (tema escuro, links sem destino). */
export function SoonBadge() {
  const { t } = useTranslation('profile');
  return (
    <View style={styles.soon}>
      <AppText variant="technical" style={styles.soonText}>
        {t('soon')}
      </AppText>
    </View>
  );
}

/** Texto de apoio (13 pt) abaixo de grupos e campos. */
export function Note({ children, testID }: { children: string; testID?: string }) {
  return (
    <AppText style={styles.note} testID={testID}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerStart: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: {
    flexShrink: 1,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.44,
    color: colors.textPrimary,
  },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 6 },
  fieldLabel: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.62,
    color: palette.sage,
    paddingLeft: 4,
  },
  field: {
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.2)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 3,
  },
  fieldFilled: { borderColor: colors.foreground },
  fieldTitle: { fontSize: 9, lineHeight: 12, letterSpacing: 1.62, color: palette.sage },
  input: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary, padding: 0 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.foreground, backgroundColor: colors.foreground },
  chipOff: { borderColor: 'rgba(16,22,15,0.2)' },
  chipText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  chipTextOn: { color: palette.cream },
  inset: { backgroundColor: 'rgba(16,22,15,0.04)', borderRadius: 18, paddingHorizontal: 16 },
  insetRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14 },
  insetDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(16,22,15,0.08)' },
  insetLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  insetMuted: { color: palette.sage },
  insetValue: { flexShrink: 1, fontSize: 13, lineHeight: 17, color: palette.sage },
  chevron: { fontSize: 18, lineHeight: 22, color: palette.sage },
  soon: {
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.15)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  soonText: { fontSize: 9, lineHeight: 12, letterSpacing: 1.26, color: palette.sage },
  note: { fontSize: 13, lineHeight: 19, color: palette.mutedCopy, paddingHorizontal: 4 },
  pressed: { opacity: 0.72 },
});
