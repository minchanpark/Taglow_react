/**
 * 리워드 신청 때 사용자가 입력하는 개인정보 형태이다.
 * 태그 데이터와는 따로 다룬다.
 */
export interface FinalEntry {
  name: string;
  phone: string;
  privacyConsent: boolean;
  consentedAt?: string;
}

/**
 * 리워드 신청을 보낼 수 있는 상태인지 확인한다.
 * 동의, 이름, 전화번호가 모두 있어야 true이다.
 */
export function isConsentReady(entry: FinalEntry): boolean {
  return Boolean(entry.privacyConsent && entry.name.trim() && entry.phone.trim());
}
