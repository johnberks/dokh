import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { NavigationControl } from '@/components/NavigationControl';
import { colors, navigationMetrics } from '@/theme/tokens';

export default function NewWorkScreen() {
  const { t } = useTranslation('agenda');
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <NavigationControl
          kind="close"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/agenda');
          }}
        />
        <View style={styles.heading}>
          <AppText accessibilityRole="header" variant="modalTitle">
            {t('newWork.title')}
          </AppText>
          <AppText variant="modalDescription" style={styles.description}>
            {t('newWork.description')}
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: navigationMetrics.modalTop,
    paddingHorizontal: navigationMetrics.modalHorizontal,
  },
  heading: {
    marginTop: navigationMetrics.modalHeadingGap,
    gap: navigationMetrics.modalDescriptionGap,
  },
  description: { color: colors.textMuted },
});
