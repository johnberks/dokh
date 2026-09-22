import { render, screen } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Text } from 'react-native';
import { BrandFontProvider, useBrandTypography } from './BrandFontProvider';
import { fontAliases, fontFamilies } from './tokens';

function Probe() {
  const typography = useBrandTypography();
  return <Text style={typography.body}>Brand font probe</Text>;
}

describe('brand font loading', () => {
  afterEach(() => {
    jest.mocked(useFonts).mockReturnValue([true, null]);
    jest.clearAllMocks();
  });

  it('keeps content hidden until font loading settles', async () => {
    jest.mocked(useFonts).mockReturnValue([false, null]);
    await render(
      <BrandFontProvider>
        <Probe />
      </BrandFontProvider>,
    );
    expect(screen.queryByText('Brand font probe')).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('uses the loaded Archivo face and hides the splash', async () => {
    const view = await render(
      <BrandFontProvider>
        <Probe />
      </BrandFontProvider>,
    );
    expect(view.getByText('Brand font probe')).toHaveStyle({
      fontFamily: fontAliases.archivoRegular,
    });
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('renders with system fallback when loading fails', async () => {
    jest.mocked(useFonts).mockReturnValue([false, new Error('font unavailable')]);
    const view = await render(
      <BrandFontProvider>
        <Probe />
      </BrandFontProvider>,
    );
    expect(view.getByText('Brand font probe')).toHaveStyle({ fontFamily: fontFamilies.fallback });
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
});
