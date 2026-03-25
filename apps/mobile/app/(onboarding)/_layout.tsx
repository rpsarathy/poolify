import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { color: COLORS.text },
      }}
    />
  );
}
