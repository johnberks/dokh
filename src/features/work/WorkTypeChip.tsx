import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import type { WorkType } from '@/domain/work-type';
import { palette } from '@/theme/tokens';

/** Chip do tipo escolhido, presente no topo das telas seguintes do primeiro Trabalho. */
export function WorkTypeChip({ type }: { type: WorkType }) {
  const { t } = useTranslation('onboarding');
  return (
    <View style={styles.chip} testID={`work-chip-${type}`}>
      <View style={styles.dot} />
      <AppText variant="technical" style={styles.label}>
        {t(`firstWork.chip.${type}` as 'firstWork.chip.shift')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, backgroundColor: palette.structure },
  label: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
});
