import { Linking } from 'react-native';

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export async function openWhatsApp(phone: string, message: string): Promise<boolean> {
  const url = buildWhatsAppLink(phone, message);
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return true;
  }
  return false;
}
