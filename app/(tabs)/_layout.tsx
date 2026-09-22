import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BottomTabs } from '@/components/BottomTabs';

/** D16: the central action is a button, never a selected tab. */
export default function TabsLayout() {
  const { t } = useTranslation('navigation');
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabs {...props} />}>
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
  );
}
