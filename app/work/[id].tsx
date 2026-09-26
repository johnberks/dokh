import { useLocalSearchParams } from 'expo-router';
import { WorkDetailScreen } from '@/features/agenda/WorkDetailScreen';

export default function WorkDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkDetailScreen workId={id} />;
}
