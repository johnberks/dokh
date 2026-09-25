import { Text as NativeText, type TextProps, type TextStyle } from 'react-native';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, type typography } from '@/theme/tokens';

export type TextVariant = keyof typeof typography;
export type TextTone = 'primary' | 'secondary' | 'error';

const toneColor: Record<TextTone, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  error: colors.errorFill,
};

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: AppTextProps) {
  const brandTypography = useBrandTypography();
  const textStyle: TextStyle = { ...brandTypography[variant], color: toneColor[tone] };
  return <NativeText {...props} style={[textStyle, style]} />;
}
