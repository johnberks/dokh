import { Redirect } from 'expo-router';

/** Só existe para ocupar o slot central da tab bar. Um deep link para /create cai no fluxo real. */
export default function CreateRedirect() {
  return <Redirect href="/work/new" />;
}
