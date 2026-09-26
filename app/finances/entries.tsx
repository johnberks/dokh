import { useLocalSearchParams } from 'expo-router';
import { monthOf } from '@/domain/calendar';
import { EntriesScreen } from '@/features/finances/EntriesScreen';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { todayInTimezone } from '@/features/work/work-schedule';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export default function EntriesRoute() {
  const { month } = useLocalSearchParams<{ month?: string }>();
  const initial = month && MONTH.test(month) ? month : monthOf(todayInTimezone(deviceTimezone()));
  return <EntriesScreen initialMonth={initial} />;
}
