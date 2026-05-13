/**
 * thanks/final 흐름에서 선택적으로 제출하는 리워드 개인정보 domain model이다.
 * 향후 ParticipantController submit method와 mapper의 final entry payload 변환에 연결된다.
 */
export interface FinalEntry {
  name: string;
  phone: string;
  privacyConsent: boolean;
  consentedAt?: string;
}

/**
 * 리워드 개인정보 제출 가능 여부를 순수 domain 규칙으로 판단한다.
 * thanks/final query나 View validation에서 FinalEntry와 함께 사용할 수 있다.
 */
export function isConsentReady(entry: FinalEntry): boolean {
  return Boolean(entry.privacyConsent && entry.name.trim() && entry.phone.trim());
}
