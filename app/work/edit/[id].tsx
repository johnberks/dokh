import { useLocalSearchParams } from 'expo-router';
import { EditWorkScreen } from '@/features/agenda/EditWorkScreen';

export default function EditWorkRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditWorkScreen workId={id} />;
}
