import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { nextAutomaticColorToken } from '@/features/locations/location-colors';
import { useWorkLocations, type WorkLocation } from '@/features/locations/locations-data';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette, type WorkLocationColorToken, workLocationColors } from '@/theme/tokens';

const MAX_SUGGESTIONS = 4;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function colorOf(token: string): string {
  return workLocationColors[token as WorkLocationColorToken] ?? palette.workSage;
}

/** Local salvo com o mesmo nome (sem acento/caixa) — o mesmo critério usado ao gravar. */
export function findLocationByName(
  locations: readonly WorkLocation[],
  name: string,
): WorkLocation | undefined {
  const target = normalize(name);
  return target ? locations.find((location) => normalize(location.name) === target) : undefined;
}

/**
 * Campo LOCAL da Agenda 07: digita o nome e escolhe entre os Locais já usados, ou mantém um
 * nome novo (criado ao salvar, com cor automática). O ponto mostra a cor que o Local terá.
 */
export function LocationField({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const locations = useWorkLocations();
  const [focused, setFocused] = useState(false);
  const all = locations.data ?? [];
  const match = findLocationByName(all, value);
  const query = normalize(value);
  const suggestions = focused
    ? all
        .filter((location) => location !== match && normalize(location.name).includes(query))
        .slice(0, MAX_SUGGESTIONS)
    : [];
  const dotColor = match
    ? colorOf(match.colorToken)
    : value.trim()
      ? colorOf(nextAutomaticColorToken(all.map((location) => location.colorToken)))
      : null;

  return (
    <View style={styles.block}>
      <View style={[styles.field, (focused || value.trim() !== '') && styles.fieldActive]}>
        <View style={styles.fieldText}>
          <AppText variant="technical" style={styles.label}>
            {t('form.location')}
          </AppText>
          <TextInput
            accessibilityLabel={t('form.location')}
            autoCapitalize="words"
            autoCorrect={false}
            onBlur={() => setFocused(false)}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder={t('form.locationPlaceholder')}
            placeholderTextColor={palette.sage}
            returnKeyType="done"
            style={[type.heading1, styles.input]}
            testID="work-location-input"
            value={value}
          />
        </View>
        {dotColor && (
          <View style={[styles.dot, { backgroundColor: dotColor }]} testID="work-location-dot" />
        )}
      </View>
      {focused && value.trim() !== '' && !match && (
        <AppText style={styles.hint}>{t('form.locationNew')}</AppText>
      )}
      {suggestions.length > 0 && (
        <View accessibilityRole="list" style={styles.suggestions}>
          {suggestions.map((location) => (
            <Pressable
              key={location.id}
              accessibilityRole="button"
              accessibilityLabel={location.name}
              onPress={() => {
                onChange(location.name);
                // Escolha feita fecha o teclado e some com a lista.
                Keyboard.dismiss();
              }}
              testID={`work-location-suggestion-${location.id}`}
              style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
            >
              <View style={[styles.dot, { backgroundColor: colorOf(location.colorToken) }]} />
              <AppText style={styles.suggestionLabel} numberOfLines={1}>
                {location.name}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  field: {
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.2)',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldActive: { borderColor: colors.foreground },
  fieldText: { flex: 1, gap: 3, paddingVertical: 8 },
  label: { fontSize: 9, lineHeight: 12, letterSpacing: 1.62, color: palette.sage },
  input: {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textPrimary,
    padding: 0,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  hint: { fontSize: 13, lineHeight: 18, color: palette.mutedCopy, paddingHorizontal: 4 },
  suggestions: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.12)',
    backgroundColor: '#F8F6EF',
    overflow: 'hidden',
  },
  suggestion: {
    minHeight: 48,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionLabel: { flex: 1, fontSize: 15, lineHeight: 19, color: colors.textPrimary },
  pressed: { opacity: 0.72 },
});
