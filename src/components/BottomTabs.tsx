import { router, type Tabs } from 'expo-router';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChartNoAxesColumn from 'lucide-react-native/icons/chart-no-axes-column';
import House from 'lucide-react-native/icons/house';
import Plus from 'lucide-react-native/icons/plus';
import UserRound from 'lucide-react-native/icons/user-round';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, navigationMetrics, shadow } from '@/theme/tokens';
import { AppText } from './AppText';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type MainTab = 'index' | 'agenda' | 'finances' | 'profile';

const tabIcons = {
  index: House,
  agenda: CalendarDays,
  finances: ChartNoAxesColumn,
  profile: UserRound,
} as const;

const tabLabels = {
  index: 'tabs.home',
  agenda: 'tabs.agenda',
  finances: 'tabs.finances',
  profile: 'tabs.profile',
} as const;

/** The four destinations and raised create action match all four tab-screen HTMLs. */
export function BottomTabs({ state, navigation }: TabBarProps) {
  const { t } = useTranslation('navigation');
  const insets = useSafeAreaInsets();

  function tab(name: MainTab) {
    const route = state.routes.find((item) => item.name === name);
    if (!route) return null;

    const focused = state.routes[state.index]?.key === route.key;
    const Icon = tabIcons[name];
    const routeKey = route.key;
    const routeName = route.name;
    const routeParams = route.params;

    function onPress() {
      const event = navigation.emit({
        type: 'tabPress',
        target: routeKey,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) navigation.navigate(routeName, routeParams);
    }

    return (
      <Pressable
        key={name}
        accessibilityRole="tab"
        accessibilityLabel={t(tabLabels[name])}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        style={styles.tab}
        testID={`tab-${name}`}
      >
        <View style={[styles.iconBox, focused && styles.activeIconBox]}>
          <Icon
            color={focused ? colors.foreground : colors.darkTextSecondary}
            size={navigationMetrics.tabIconSize}
            strokeWidth={navigationMetrics.tabIconStroke}
          />
        </View>
        <AppText
          variant={focused ? 'tabLabelActive' : 'tabLabel'}
          style={[styles.label, focused ? styles.activeLabel : styles.inactiveLabel]}
        >
          {t(tabLabels[name])}
        </AppText>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(navigationMetrics.tabBarBottom, insets.bottom) },
      ]}
    >
      <View style={styles.row}>
        {tab('index')}
        {tab('agenda')}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.create')}
          onPress={() => router.push('/work/new')}
          style={styles.create}
          testID="tab-create"
        >
          <Plus
            color={colors.accent}
            size={navigationMetrics.createIconSize}
            strokeWidth={navigationMetrics.createIconStroke}
          />
        </Pressable>
        {tab('finances')}
        {tab('profile')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background,
    borderTopColor: colors.tabBarBorder,
    borderTopWidth: 1,
    paddingTop: navigationMetrics.tabBarTop,
    paddingHorizontal: navigationMetrics.tabBarHorizontal,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tab: {
    width: navigationMetrics.tabWidth,
    minHeight: 44,
    alignItems: 'center',
    gap: navigationMetrics.tabLabelGap,
  },
  iconBox: {
    width: navigationMetrics.tabIconBoxWidth,
    height: navigationMetrics.tabIconBoxHeight,
    borderRadius: navigationMetrics.tabIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBox: { backgroundColor: colors.tabActiveBackground },
  label: { textTransform: 'uppercase' },
  activeLabel: { color: colors.foreground },
  inactiveLabel: { color: colors.darkTextSecondary },
  create: {
    width: navigationMetrics.createDiameter,
    height: navigationMetrics.createDiameter,
    minHeight: navigationMetrics.createDiameter,
    borderRadius: navigationMetrics.createDiameter / 2,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -navigationMetrics.createLift,
    ...shadow.tabCreate,
  },
});
