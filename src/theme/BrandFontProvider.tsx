import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, type ReactNode, useContext, useEffect } from 'react';
import { brandFontAssets } from './brand-fonts';
import { getTypography } from './tokens';

// Called before the layout renders so the native splash remains until fonts settle.
void SplashScreen.preventAutoHideAsync();

const BrandFontsLoadedContext = createContext(false);

export function BrandFontProvider({ children }: { children: ReactNode }) {
  const [loaded, error] = useFonts(brandFontAssets);

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <BrandFontsLoadedContext.Provider value={loaded}>{children}</BrandFontsLoadedContext.Provider>
  );
}

export function useBrandTypography() {
  return getTypography(useContext(BrandFontsLoadedContext));
}
