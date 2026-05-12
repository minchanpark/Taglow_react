export const maxTagTextLength = 100;

export function validateTagText(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return '짧은 태그를 먼저 입력해주세요.';
  if (trimmed.length > maxTagTextLength) {
    return `태그는 최대 ${maxTagTextLength}자까지 입력할 수 있어요.`;
  }
  return undefined;
}

export function validateRewardName(value: string): string | undefined {
  return value.trim() ? undefined : '이름을 입력해주세요.';
}

export function validatePhoneNumber(value: string): string | undefined {
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length >= 8 ? undefined : '연락처를 확인해주세요.';
}

