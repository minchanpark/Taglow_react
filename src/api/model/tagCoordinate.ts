/**
 * 이미지 안에서의 위치를 0부터 1 사이 비율로 나타낸다.
 * 픽셀 대신 비율을 쓰면 화면 크기가 달라도 같은 위치를 가리킨다.
 */
export interface TagCoordinate {
  xRatio: number;
  yRatio: number;
}

/**
 * x, y 값을 안전한 TagCoordinate로 만든다.
 * 0보다 작거나 1보다 큰 값은 범위 안으로 잘라낸다.
 */
export function createTagCoordinate(xRatio: number, yRatio: number): TagCoordinate {
  return {
    xRatio: clampRatio(xRatio),
    yRatio: clampRatio(yRatio),
  };
}

/**
 * 숫자 하나를 0부터 1 사이로 제한한다.
 * 좌표 값이 이미지 밖으로 나가지 않게 한다.
 */
export function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * 좌표를 알 수 없을 때 쓰는 기본 위치이다.
 * 이미지의 가운데를 의미한다.
 */
export const defaultTagCoordinate = createTagCoordinate(0.5, 0.5);
