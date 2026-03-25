import { Stack } from 'expo-router';
import { COLORS } from '../../../src/constants/theme';

export default function RequestsLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: COLORS.background }, headerTintColor: COLORS.primary, headerTitleStyle: { color: COLORS.text } }} />
  );
}
