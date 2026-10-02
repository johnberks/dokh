import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BottomTabs } from '@/components/BottomTabs';
import { GuideTourOverlay } from '@/features/guide/GuideTourOverlay';
import { useTourTarget } from '@/features/guide/useTourTarget';

/** D16: the central action is a button, never a selected tab. */
export default function TabsLayout() {
  const { t } = useTranslation('navigation');
  const tabBar = useTourTarget('tab-bar');
  // A barra não se mexe: as abas de destino podem ser medidas quase na hora.
  const homeTab = useTourTarget('tab-index', 60);
  const agendaTab = useTourTarget('tab-agenda', 60);
  const financesTab = useTourTarget('tab-finances', 60);
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <BottomTabs
            {...props}
            rowRef={tabBar.ref}
            onRowLayout={tabBar.onLayout}
            tabTargets={{ index: homeTab, agenda: agendaTab, finances: financesTab }}
          />
        )}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
          }}
        />
        <Tabs.Screen
          name="agenda"
          options={{
            title: t('tabs.agenda'),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: '',
            href: null,
          }}
        />
        <Tabs.Screen
          name="finances"
          options={{
            title: t('tabs.finances'),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
          }}
        />
      </Tabs>
      {/* Guia de primeiro uso: por cima das abas e da barra, só logo depois do onboarding. */}
      <GuideTourOverlay />
    </View>
  );
}
