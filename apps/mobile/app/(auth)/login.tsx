import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { CONFIG } from '../../src/constants/config';
import { useAuthStore } from '../../src/store/auth.store';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { authError } from '../_layout';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTokens } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (authError) setError(authError);
  }, []);

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        window.location.href = `${CONFIG.API_URL}/api/auth/google`;
        return;
      }
      const redirectUri = Linking.createURL('auth/callback');
      const result = await WebBrowser.openAuthSessionAsync(
        `${CONFIG.API_URL}/api/auth/google`,
        redirectUri
      );
      if (result.type === 'success' && result.url) {
        const parsed = new URL(result.url);
        const err = parsed.searchParams.get('error');
        if (err) { setError(`Authentication failed: ${err}`); return; }
        const accessToken = parsed.searchParams.get('accessToken');
        const refreshToken = parsed.searchParams.get('refreshToken');
        if (accessToken && refreshToken) {
          await setTokens(accessToken, refreshToken);
          router.replace('/(onboarding)/role');
        } else {
          setError('No credentials received. Please try again.');
        }
      } else if (result.type === 'cancel') {
        setError('Sign-in was cancelled.');
      }
    } catch {
      setError('Could not connect to server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>POOLIFY</Text>
          <Text style={styles.subtitle}>Share rides. Save money. Go green.</Text>
        </View>

        <View style={styles.features}>
          {[
            { icon: '🗺️', text: 'Smart route matching' },
            { icon: '💬', text: 'Connect via WhatsApp' },
            { icon: '💰', text: 'Split commute costs' },
          ].map((f) => (
            <View key={f.text} style={styles.feature}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.buttonText}>Continue with Google</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>By continuing, you agree to our Terms of Service</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 229, 204, 0.05)',
    top: -120,
    right: -120,
  },
  circle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(168, 85, 247, 0.04)',
    bottom: -80,
    left: -80,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  hero: { alignItems: 'center', marginBottom: SPACING.xl },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  logo: { width: 120, height: 120 },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  features: {
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureIcon: { fontSize: 18 },
  featureText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  errorBox: {
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { color: '#FCA5A5', fontSize: 14, flex: 1 },
  dismissText: { color: '#FCA5A5', fontSize: 18, fontWeight: '700', paddingLeft: SPACING.sm },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: SPACING.xl,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: 'rgba(0,0,0,0.2)',
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonText: { color: COLORS.background, fontSize: 16, fontWeight: '700' },
  terms: { fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.lg, textAlign: 'center' },
});
