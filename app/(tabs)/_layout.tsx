import { type Href, router, Tabs } from 'expo-router';
import { CalendarDays, House, Plus, User, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export const NEW_WORK_HREF: Href = '/work/new';

/**
 * D16: Início, Agenda, ação central, Finanças e Perfil.
 * A ação central não é uma tab: intercepta o toque e abre o fluxo de criação (o mesmo da Agenda).
 */
export default function TabsLayout() {
  const { t } = useTranslation('navigation');
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: t('tabs.agenda'),
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarAccessibilityLabel: t('tabs.create'),
          tabBarButtonTestID: 'tab-create',
          tabBarIcon: ({ color, size }) => <Plus color={color} size={size} />,
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.push(NEW_WORK_HREF);
          },
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: t('tabs.finances'),
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
