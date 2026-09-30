import { Redirect, useLocalSearchParams } from 'expo-router';
import { monthOf } from '@/domain/calendar';
import { usePremium } from '@/features/billing/entitlement';
import { HourlyAnalysisScreen } from '@/features/finances/HourlyAnalysisScreen';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { todayInTimezone } from '@/features/work/work-schedule';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Análise completa é 100% Premium: sem entitlement, volta para Finanças. */
export default function HourlyAnalysisRoute() {
  const { month } = useLocalSearchParams<{ month?: string }>();
  const premium = usePremium();
  if (premium.data === false) return <Redirect href="/finances" />;
  const initial = month && MONTH.test(month) ? month : monthOf(todayInTimezone(deviceTimezone()));
  return <HourlyAnalysisScreen month={initial} />;
}
