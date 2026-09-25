import { render, screen } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Text } from 'react-native';
import { AppText } from '@/components/AppText';
import { Input } from '@/components/Input';
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

  it('lets the route guard keep the splash until session and profile settle', async () => {
    await render(
      <BrandFontProvider hideSplashWhenReady={false}>
        <Probe />
      </BrandFontProvider>,
    );
    expect(screen.getByText('Brand font probe')).toBeTruthy();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
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

  it('uses the loaded font in text and input primitives', async () => {
    const view = await render(
      <BrandFontProvider>
        <AppText>Texto da interface</AppText>
        <Input label="Local" value="Hospital" onChangeText={() => {}} />
      </BrandFontProvider>,
    );
    expect(view.getByText('Texto da interface')).toHaveStyle({
      fontFamily: fontAliases.archivoRegular,
    });
    expect(view.getByLabelText('Local')).toHaveStyle({ fontFamily: fontAliases.archivoRegular });
  });

  it('keeps text and input primitives readable when font loading fails', async () => {
    jest.mocked(useFonts).mockReturnValue([false, new Error('font unavailable')]);
    const view = await render(
      <BrandFontProvider>
        <AppText>Texto da interface</AppText>
        <Input label="Local" value="Hospital" onChangeText={() => {}} />
      </BrandFontProvider>,
    );
    expect(view.getByText('Texto da interface')).toHaveStyle({
      fontFamily: fontFamilies.fallback,
    });
    expect(view.getByLabelText('Local')).toHaveStyle({ fontFamily: fontFamilies.fallback });
  });
});
