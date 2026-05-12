export interface TagCoordinate {
  xRatio: number;
  yRatio: number;
}

export function createTagCoordinate(xRatio: number, yRatio: number): TagCoordinate {
  return {
    xRatio: clampRatio(xRatio),
    yRatio: clampRatio(yRatio),
  };
}

export function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export const defaultTagCoordinate = createTagCoordinate(0.5, 0.5);

