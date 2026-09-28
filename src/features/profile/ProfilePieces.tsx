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
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10',
  camera:
    'M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5L16 6.5h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  plus: 'M12 5v14M5 12h14',
  pencil: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
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

/** Rótulo de seção dos formulários: texto normal e forte, legível sobre o creme. */
export function FieldLabel({ children }: { children: string }) {
  const type = useBrandTypography();
  return <AppText style={[type.heading1, styles.fieldLabel]}>{children}</AppText>;
}

/**
 * Campo preenchido das subtelas do Perfil (referências Subway/Fresha — Mobbin, 2026-09-27):
 * superfície clara sobre o creme, rótulo legível em cima e valor em negrito.
 */
export function TextField({
  label,
  prefix,
  testID,
  ...input
}: Omit<TextInputProps, 'style' | 'accessibilityLabel'> & {
  label: string;
  prefix?: string;
  testID?: string;
}) {
  const type = useBrandTypography();
  return (
    <View style={styles.field}>
      <AppText style={[type.heading1, styles.fieldTitle]}>{label}</AppText>
      <View style={styles.fieldInputRow}>
        {prefix ? <AppText style={[type.heading1, styles.prefix]}>{prefix}</AppText> : null}
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor="rgba(16,22,15,0.38)"
          style={[type.heading1, styles.input]}
          testID={testID}
        />
      </View>
    </View>
  );
}

/** Mesmo campo, mas abre uma folha (mês, dia, horário). */
export function PickerField({
  label,
  value,
  placeholder,
  onPress,
  testID,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  testID?: string;
}) {
  const type = useBrandTypography();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text: value ?? placeholder }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.field, styles.pickerField, pressed && styles.rowPressed]}
    >
      <View style={styles.pickerText}>
        <AppText style={[type.heading1, styles.fieldTitle]}>{label}</AppText>
        <AppText
          numberOfLines={1}
          style={[type.heading1, styles.input, value === null && styles.placeholder]}
        >
          {value ?? placeholder}
        </AppText>
      </View>
      <AppText style={styles.chevron}>{'›'}</AppText>
    </Pressable>
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
              style={[type.heading1, styles.chipText, on && styles.chipTextOn]}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Título de seção em texto normal (não em letra técnica maiúscula): as listas do Perfil são de
 * um nível só, como nos apps de referência (Wise, GoHenry, Marcus — Mobbin, 2026-09-27).
 */
export function SectionTitle({ children, testID }: { children: string; testID?: string }) {
  const type = useBrandTypography();
  return (
    <AppText
      accessibilityRole="header"
      style={[type.heading1, styles.sectionTitle]}
      testID={testID}
    >
      {children}
    </AppText>
  );
}

/**
 * Lista de um nível. Na tela principal é plana; nas subtelas (`grouped`) fica num grupo claro
 * arredondado sobre o creme, como os ajustes do Todoist/Zocdoc (Mobbin, 2026-09-27).
 */
export function InsetList({
  children,
  grouped = false,
}: {
  children: ReactNode;
  grouped?: boolean;
}) {
  return <View style={grouped ? styles.grouped : styles.inset}>{children}</View>;
}

export function InsetRow({
  label,
  value,
  subtitle,
  icon,
  accessory,
  onPress,
  last = false,
  muted = false,
  testID,
}: {
  label: string;
  value?: string | null;
  subtitle?: string | null;
  icon?: ReactNode;
  accessory?: ReactNode;
  onPress?: () => void;
  last?: boolean;
  muted?: boolean;
  testID?: string;
}) {
  const type = useBrandTypography();
  const content = (
    <>
      {icon ? <View style={styles.insetIcon}>{icon}</View> : null}
      <View style={[styles.insetBody, !last && styles.insetDivider]}>
        <View style={styles.insetText}>
          <AppText style={[type.heading1, styles.insetLabel, muted && styles.insetMuted]}>
            {label}
          </AppText>
          {subtitle ? (
            <AppText numberOfLines={1} style={styles.insetSubtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {value ? (
          <AppText numberOfLines={1} style={styles.insetValue}>
            {value}
          </AppText>
        ) : null}
        {accessory ?? (onPress ? <AppText style={styles.chevron}>{'›'}</AppText> : null)}
      </View>
    </>
  );
  const label11y = [label, subtitle, value].filter(Boolean).join(', ');
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label11y} style={styles.insetRow} testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label11y}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.insetRow, pressed && styles.rowPressed]}
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
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.15,
    color: colors.textPrimary,
    paddingLeft: 2,
  },
  field: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.12)',
    backgroundColor: palette.previewPaper,
    paddingHorizontal: 16,
    paddingVertical: 11,
    justifyContent: 'center',
    gap: 4,
  },
  fieldInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prefix: { fontSize: 17, lineHeight: 22, letterSpacing: 0, color: palette.mutedCopy },
  pickerField: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pickerText: { flex: 1, gap: 4 },
  placeholder: { color: 'rgba(16,22,15,0.38)' },
  fieldTitle: { fontSize: 13, lineHeight: 17, letterSpacing: 0, color: palette.mutedCopy },
  input: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.17,
    color: colors.textPrimary,
    padding: 0,
  },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.foreground, backgroundColor: colors.foreground },
  chipOff: { borderColor: 'rgba(16,22,15,0.12)', backgroundColor: palette.previewPaper },
  chipText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  chipTextOn: { color: palette.cream },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.17,
    color: colors.textPrimary,
    paddingBottom: 4,
  },
  inset: {},
  grouped: {
    backgroundColor: palette.previewPaper,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.1)',
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  insetRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowPressed: { opacity: 0.6 },
  insetIcon: { width: 22, alignItems: 'center' },
  insetBody: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  insetDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(16,22,15,0.18)',
  },
  insetText: { flex: 1, gap: 2 },
  insetLabel: { fontSize: 16, lineHeight: 21, letterSpacing: -0.16, color: colors.textPrimary },
  insetMuted: { color: palette.sage },
  insetSubtitle: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  insetValue: {
    flexShrink: 1,
    maxWidth: 170,
    fontSize: 15,
    lineHeight: 20,
    color: palette.mutedCopy,
  },
  chevron: { fontSize: 18, lineHeight: 22, color: palette.sage },
  soon: {
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.15)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  soonText: { fontSize: 9, lineHeight: 12, letterSpacing: 1.26, color: palette.sage },
  note: { fontSize: 14, lineHeight: 20, color: palette.mutedCopy, paddingHorizontal: 4 },
  pressed: { opacity: 0.72 },
});
