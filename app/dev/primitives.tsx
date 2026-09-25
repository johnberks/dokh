import { Redirect } from 'expo-router';
import { PrimitivesCatalog } from '@/components/PrimitivesCatalog';
import { OnboardingArtCatalog } from '@/features/onboarding/art/OnboardingArtCatalog';

/** Internal catalog. The route never exposes a product screen in release builds. */
export default function PrimitivesCatalogRoute() {
  // As ilustrações guardadas do onboarding entram por aqui: componentes não importam features.
  return __DEV__ ? <PrimitivesCatalog extra={<OnboardingArtCatalog />} /> : <Redirect href="/" />;
}
