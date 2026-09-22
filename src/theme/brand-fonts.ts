import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from '@expo-google-fonts/archivo';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { Unbounded_600SemiBold } from '@expo-google-fonts/unbounded';
import { fontAliases } from './tokens';

/** Keys must match fontFamily aliases in tokens.ts exactly. */
export const brandFontAssets = {
  [fontAliases.archivoRegular]: Archivo_400Regular,
  [fontAliases.archivoMedium]: Archivo_500Medium,
  [fontAliases.archivoSemibold]: Archivo_600SemiBold,
  [fontAliases.archivoBold]: Archivo_700Bold,
  [fontAliases.plexRegular]: IBMPlexMono_400Regular,
  [fontAliases.plexMedium]: IBMPlexMono_500Medium,
  [fontAliases.unboundedSemibold]: Unbounded_600SemiBold,
};
