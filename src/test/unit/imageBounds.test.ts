import { describe, expect, it } from 'vitest';

import { createTagCoordinate } from '../../api/model';
import { pixelToRatio, ratioToPixel } from '../../utils/coordinateConverter';
import { computeContainedImageRect, pointToImageRatio } from '../../utils/imageBounds';

describe('image bounds helpers', () => {
  it('computes the rendered image rect for contain fitting', () => {
    expect(
      computeContainedImageRect({
        viewportWidth: 300,
        viewportHeight: 600,
        imageAspectRatio: 1,
      }),
    ).toEqual({
      left: 0,
      top: 150,
      width: 300,
      height: 300,
    });
  });

  it('converts a client point to a clamped image ratio', () => {
    const localPoint = pointToImageRatio({
      clientX: 80,
      clientY: 190,
      imageRect: { left: 20, top: 100, width: 120, height: 180 },
    });

    expect(pixelToRatio(localPoint)).toEqual(createTagCoordinate(0.5, 0.5));
  });

  it('converts ratio coordinates back to pixels', () => {
    expect(
      ratioToPixel({
        coordinate: createTagCoordinate(0.25, 0.75),
        width: 200,
        height: 400,
      }),
    ).toEqual({ x: 50, y: 300 });
  });
});
