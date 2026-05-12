import { createTagCoordinate, type TagCoordinate } from '../api/model';

export function pixelToRatio(params: {
  localX: number;
  localY: number;
  width: number;
  height: number;
}): TagCoordinate {
  const { localX, localY, width, height } = params;
  if (width <= 0 || height <= 0) return createTagCoordinate(0.5, 0.5);

  return createTagCoordinate(localX / width, localY / height);
}

export function ratioToPixel(params: {
  coordinate: TagCoordinate;
  width: number;
  height: number;
}): { x: number; y: number } {
  return {
    x: params.coordinate.xRatio * params.width,
    y: params.coordinate.yRatio * params.height,
  };
}

