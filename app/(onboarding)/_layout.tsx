import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* A conclusão não volta: o Trabalho já foi gravado e voltar convidaria a gravar de novo. */}
      <Stack.Screen name="first-work-done" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
