import { Redirect } from 'expo-router';
import { PrimitivesCatalog } from '@/components/PrimitivesCatalog';

/** Internal catalog. The route never exposes a product screen in release builds. */
export default function PrimitivesCatalogRoute() {
  return __DEV__ ? <PrimitivesCatalog /> : <Redirect href="/" />;
}
