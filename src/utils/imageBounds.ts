export interface DOMRectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function computeContainedImageRect(params: {
  viewportWidth: number;
  viewportHeight: number;
  imageAspectRatio: number;
}): DOMRectLike {
  const { viewportWidth, viewportHeight, imageAspectRatio } = params;
  if (viewportWidth <= 0 || viewportHeight <= 0 || imageAspectRatio <= 0) {
    return { left: 0, top: 0, width: Math.max(0, viewportWidth), height: Math.max(0, viewportHeight) };
  }

  const viewportAspectRatio = viewportWidth / viewportHeight;
  let width: number;
  let height: number;

  if (imageAspectRatio > viewportAspectRatio) {
    width = viewportWidth;
    height = viewportWidth / imageAspectRatio;
  } else {
    height = viewportHeight;
    width = viewportHeight * imageAspectRatio;
  }

  return {
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
    height,
  };
}

export function pointToImageRatio(params: {
  clientX: number;
  clientY: number;
  imageRect: DOMRectLike;
}) {
  const localX = params.clientX - params.imageRect.left;
  const localY = params.clientY - params.imageRect.top;

  return {
    localX,
    localY,
    width: params.imageRect.width,
    height: params.imageRect.height,
  };
}

