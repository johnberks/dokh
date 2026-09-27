import { useLocalSearchParams } from 'expo-router';
import { LocationFormScreen } from '@/features/profile/LocationsScreens';

export default function EditLocationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LocationFormScreen locationId={id} />;
}
