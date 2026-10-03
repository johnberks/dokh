import { router, type Tabs } from 'expo-router';
import type { ComponentProps, RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarDaysIcon,
  ChartBarIcon,
  HomeIcon,
  PlusIcon,
  UserCircleIcon,
} from '@/components/icons/heroicons';
import { colors, navigationMetrics, shadow } from '@/theme/tokens';
import { AppText } from './AppText';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type MainTab = 'index' | 'agenda' | 'finances' | 'profile';

const tabIcons = {
  index: HomeIcon,
  agenda: CalendarDaysIcon,
  finances: ChartBarIcon,
  profile: UserCircleIcon,
} as const;

const tabLabels = {
  index: 'tabs.home',
  agenda: 'tabs.agenda',
  finances: 'tabs.finances',
  profile: 'tabs.profile',
} as const;

/** The four destinations and raised create action match all four tab-screen HTMLs. */
/** `rowRef`/`onRowLayout`: marcam a barra para o guia de primeiro uso (vêm do layout das abas). */
export function BottomTabs({
  state,
  navigation,
  rowRef,
  onRowLayout,
  tabTargets,
  onCreatePress,
}: TabBarProps & {
  /** `+` central; recebe a aba ativa (padrão: abrir o novo Trabalho sem data). */
  onCreatePress?: (activeTab: string) => void;
  rowRef?: RefObject<View | null>;
  onRowLayout?: () => void;
  /** Abas marcadas pelo guia, acesas na passagem entre seções. */
  tabTargets?: Partial<
    Record<MainTab, { ref: RefObject<View | null>; onLayout: (() => void) | undefined }>
  >;
}) {
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
        ref={tabTargets?.[name]?.ref}
        onLayout={tabTargets?.[name]?.onLayout}
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
      <View ref={rowRef} onLayout={onRowLayout} style={styles.row}>
        {tab('index')}
        {tab('agenda')}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.create')}
          onPress={() => {
            const active = state.routes[state.index]?.name ?? '';
            if (onCreatePress) onCreatePress(active);
            else router.push('/work/new');
          }}
          style={styles.create}
          testID="tab-create"
        >
          <PlusIcon color={colors.accent} size={navigationMetrics.createIconSize} />
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
