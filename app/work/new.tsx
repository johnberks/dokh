import { router } from 'expo-router';
import { NewWorkFlow } from '@/features/work/form/NewWorkFlow';

/** Modal do `+`: fechar ou salvar volta para onde a pessoa estava. */
export default function NewWorkScreen() {
  return (
    <NewWorkFlow
      onClose={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/agenda');
      }}
    />
  );
}
