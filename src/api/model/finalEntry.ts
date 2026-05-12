export interface FinalEntry {
  name: string;
  phone: string;
  privacyConsent: boolean;
  consentedAt?: string;
}

export function isConsentReady(entry: FinalEntry): boolean {
  return Boolean(entry.privacyConsent && entry.name.trim() && entry.phone.trim());
}

