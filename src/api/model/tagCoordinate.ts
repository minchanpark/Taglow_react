/**
 * rendered image bounds 기준 0.0..1.0 ratio 좌표이다.
 * mapper와 detail View의 좌표 변환은 pixel이 아니라 이 domain model로만 저장한다.
 */
export interface TagCoordinate {
  xRatio: number;
  yRatio: number;
}

/**
 * raw ratio 값을 clamp해 유효한 TagCoordinate를 만든다.
 * ParticipantPayloadMapper.tagFromPayload와 image bounds utils가 좌표 생성에 사용한다.
 */
export function createTagCoordinate(xRatio: number, yRatio: number): TagCoordinate {
  return {
    xRatio: clampRatio(xRatio),
    yRatio: clampRatio(yRatio),
  };
}

/**
 * 단일 ratio 값을 0.0..1.0 범위로 제한한다.
 * createTagCoordinate가 x/y 좌표 각각에 적용한다.
 */
export function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * 좌표를 계산할 수 없을 때 사용하는 이미지 중앙 fallback이다.
 * detail View와 utility 함수가 안전한 기본 태그 위치로 사용할 수 있다.
 */
export const defaultTagCoordinate = createTagCoordinate(0.5, 0.5);
