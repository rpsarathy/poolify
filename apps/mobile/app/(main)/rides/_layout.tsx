import { Stack } from 'expo-router';
import { COLORS } from '../../../src/constants/theme';

export default function RidesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { color: COLORS.text },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Rides' }} />
      <Stack.Screen name="post" options={{ title: 'Offer a Ride' }} />
      <Stack.Screen name="search" options={{ title: 'Find a Ride' }} />
      <Stack.Screen name="[id]" options={{ title: 'Ride Details' }} />
    </Stack>
  );
}
