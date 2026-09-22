import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_500Medium } from '@expo-google-fonts/archivo/500Medium';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';
import { Unbounded_600SemiBold } from '@expo-google-fonts/unbounded/600SemiBold';
import { fontAliases } from './tokens';

/** Keys must match fontFamily aliases in tokens.ts exactly. */
export const brandFontAssets = {
  [fontAliases.archivoRegular]: Archivo_400Regular,
  [fontAliases.archivoMedium]: Archivo_500Medium,
  [fontAliases.archivoSemibold]: Archivo_600SemiBold,
  [fontAliases.archivoBold]: Archivo_700Bold,
  [fontAliases.plexRegular]: IBMPlexMono_400Regular,
  [fontAliases.plexMedium]: IBMPlexMono_500Medium,
  [fontAliases.plexSemibold]: IBMPlexMono_600SemiBold,
  [fontAliases.unboundedSemibold]: Unbounded_600SemiBold,
};
