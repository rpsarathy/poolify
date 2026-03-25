import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/auth.store';
import { usersService } from '../src/services/users.service';
import { useWebSocket } from '../src/hooks/useWebSocket';

// Shared auth error state — login screen reads this
export let authError: string | null = null;

/**
 * Extract OAuth tokens from URL on web
 */
async function extractTokensFromUrl(): Promise<boolean> {
  if (Platform.OS !== 'web') return false;

  try {
    const url = new URL(window.location.href);

    // Check for error from Google/backend
    const error = url.searchParams.get('error');
    if (error) {
      authError = `Authentication failed: ${error}`;
      window.history.replaceState({}, '', '/');
      return false;
    }

    const accessToken = url.searchParams.get('accessToken');
    const refreshToken = url.searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      await useAuthStore.getState().setTokens(accessToken, refreshToken);

      try {
        const user = await usersService.getMe();
        useAuthStore.getState().setUser(user);
      } catch (err) {
        // Token valid but profile fetch failed
        authError = 'Signed in but failed to load your profile. Please try again.';
        await useAuthStore.getState().logout();
        window.history.replaceState({}, '', '/');
        return false;
      }

      window.history.replaceState({}, '', '/');
      return true;
    }
  } catch {
    authError = 'Something went wrong during sign-in. Please try again.';
  }
  return false;
}

function NavigationGuard() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useWebSocket();

  useEffect(() => {
    if (!navigationState?.key) return;
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!isAuthenticated) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    if (isAuthenticated && user && !user.isOnboarded) {
      if (!inOnboarding) router.replace('/(onboarding)/role');
      return;
    }

    if (isAuthenticated && user?.isOnboarded) {
      if (inAuth || inOnboarding) router.replace('/(main)/home');
    }
  }, [isAuthenticated, isLoading, user, segments, navigationState?.key]);

  return null;
}

export default function RootLayout() {
  const { loadFromStorage } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const hadTokens = await extractTokensFromUrl();
      if (!hadTokens) {
        await loadFromStorage();
      } else {
        useAuthStore.setState({ isLoading: false });
      }
      setReady(true);
    }
    init();
  }, []);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="auto" />
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </>
  );
}
