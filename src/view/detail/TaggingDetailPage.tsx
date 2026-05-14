import { ChevronLeft } from 'lucide-react';
import type { CSSProperties, FormEvent, PointerEvent, SyntheticEvent, WheelEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useTaggingDetailQuery } from '../../api/query/useTaggingDetailQuery';
import { createTagCoordinate, type ParticipantTag, type TagCoordinate } from '../../api/model';
import stickerCircleUrl from '../../assets/sticker/sticker_circle.png';
import stickerDiamondUrl from '../../assets/sticker/sticker_diamond.png';
import stickerSquareUrl from '../../assets/sticker/sticker_square.png';
import stickerTriangleUrl from '../../assets/sticker/sticker_triangle.png';
import { pixelToRatio } from '../../utils/coordinateConverter';
import { computeContainedImageRect, pointToImageRatio } from '../../utils/imageBounds';
import { validateTagText } from '../../utils/inputValidator';
import { TaggingImageArea } from './components/TaggingImageArea';
import { TaggingInputDock } from './components/TaggingInputDock';
import './TaggingDetailPage.css';

const fallbackImageAspectRatio = 4 / 5;
const stickerUrls = [stickerSquareUrl, stickerDiamondUrl, stickerTriangleUrl, stickerCircleUrl];
const minImageZoomScale = 1;
const maxImageZoomScale = 3.5;
const wheelZoomSpeed = 0.0015;

interface StagedStickerTag {
  id: string;
  seed: number;
  text: string;
  stickerUrl: string;
}

interface DragPosition {
  x: number;
  y: number;
}

interface ImageViewportTransform {
  scale: number;
  x: number;
  y: number;
}

interface ImagePointerPosition {
  clientX: number;
  clientY: number;
}

interface ImagePanSnapshot {
  pointerId: number;
  clientX: number;
  clientY: number;
  transform: ImageViewportTransform;
}

interface ImagePinchSnapshot {
  centerX: number;
  centerY: number;
  distance: number;
  transform: ImageViewportTransform;
}

const initialImageViewportTransform: ImageViewportTransform = { scale: 1, x: 0, y: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distanceBetweenPointers(first: ImagePointerPosition, second: ImagePointerPosition) {
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

export function TaggingDetailPage() {
  const { eventId = '11', votePostId = '31' } = useParams();
  const { errorMessage, isLoading, isSavingTag, retry, submitTextTag, tagErrorMessage, tags, votePost } =
    useTaggingDetailQuery({ eventId, votePostId });
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const imageStageRef = useRef<HTMLDivElement>(null);
  const imageViewportTransformRef = useRef<ImageViewportTransform>(initialImageViewportTransform);
  const activeImagePointersRef = useRef(new Map<number, ImagePointerPosition>());
  const imagePanSnapshotRef = useRef<ImagePanSnapshot>();
  const imagePinchSnapshotRef = useRef<ImagePinchSnapshot>();
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [imageAspectRatio, setImageAspectRatio] = useState(votePost?.imageRatio ?? fallbackImageAspectRatio);
  const [imageViewportTransform, setImageViewportTransform] = useState<ImageViewportTransform>(
    initialImageViewportTransform,
  );
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [tagText, setTagText] = useState('');
  const [draftError, setDraftError] = useState<string>();
  const [stagedTag, setStagedTag] = useState<StagedStickerTag>();
  const [stagedDragPosition, setStagedDragPosition] = useState<DragPosition>();
  const [isDraggingStagedTag, setIsDraggingStagedTag] = useState(false);

  useEffect(() => {
    imageViewportTransformRef.current = initialImageViewportTransform;
    activeImagePointersRef.current.clear();
    imagePanSnapshotRef.current = undefined;
    imagePinchSnapshotRef.current = undefined;
    setImageAspectRatio(votePost?.imageRatio ?? fallbackImageAspectRatio);
    setImageViewportTransform(initialImageViewportTransform);
    setImageState(votePost?.imageUrl ? 'loading' : 'error');
    setTagText('');
    setDraftError(undefined);
    setStagedTag(undefined);
    setStagedDragPosition(undefined);
    setIsDraggingStagedTag(false);
  }, [votePost?.id, votePost?.imageRatio, votePost?.imageUrl]);

  useEffect(() => {
    const bodyStyle = document.body.style;
    const documentStyle = document.documentElement.style;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyOverscrollBehavior = bodyStyle.overscrollBehavior;
    const previousDocumentOverflow = documentStyle.overflow;
    const previousDocumentOverscrollBehavior = documentStyle.overscrollBehavior;

    bodyStyle.overflow = 'hidden';
    bodyStyle.overscrollBehavior = 'none';
    documentStyle.overflow = 'hidden';
    documentStyle.overscrollBehavior = 'none';

    return () => {
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.overscrollBehavior = previousBodyOverscrollBehavior;
      documentStyle.overflow = previousDocumentOverflow;
      documentStyle.overscrollBehavior = previousDocumentOverscrollBehavior;
    };
  }, []);

  useLayoutEffect(() => {
    const stage = imageStageRef.current;
    if (!stage) return undefined;

    const updateStageSize = () => {
      const rect = stage.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };

    updateStageSize();
    const resizeObserver = new ResizeObserver(updateStageSize);
    resizeObserver.observe(stage);
    return () => resizeObserver.disconnect();
  }, []);

  const imageFrame = computeContainedImageRect({
    viewportWidth: stageSize.width,
    viewportHeight: stageSize.height,
    imageAspectRatio,
  });

  const imageFrameStyle = {
    left: `${imageFrame.left}px`,
    top: `${imageFrame.top}px`,
    width: `${imageFrame.width}px`,
    height: `${imageFrame.height}px`,
    transform: `translate3d(${imageViewportTransform.x}px, ${imageViewportTransform.y}px, 0) scale(${imageViewportTransform.scale})`,
  } satisfies CSSProperties;

  const constrainImageViewportTransform = useCallback(
    (transform: ImageViewportTransform): ImageViewportTransform => {
      const scale = clamp(transform.scale, minImageZoomScale, maxImageZoomScale);
      if (scale <= minImageZoomScale || imageFrame.width <= 0 || imageFrame.height <= 0) {
        return initialImageViewportTransform;
      }

      return {
        scale,
        x: clamp(transform.x, imageFrame.width * (1 - scale), 0),
        y: clamp(transform.y, imageFrame.height * (1 - scale), 0),
      };
    },
    [imageFrame.height, imageFrame.width],
  );

  const commitImageViewportTransform = useCallback(
    (transform: ImageViewportTransform) => {
      const nextTransform = constrainImageViewportTransform(transform);
      imageViewportTransformRef.current = nextTransform;
      setImageViewportTransform(nextTransform);
    },
    [constrainImageViewportTransform],
  );

  useEffect(() => {
    commitImageViewportTransform(imageViewportTransformRef.current);
  }, [commitImageViewportTransform]);

  function clientPointToStagePoint(clientX: number, clientY: number) {
    const stageRect = imageStageRef.current?.getBoundingClientRect();
    if (!stageRect) return undefined;

    return {
      x: clientX - stageRect.left,
      y: clientY - stageRect.top,
    };
  }

  function zoomImageAtClientPoint(transform: ImageViewportTransform, nextScale: number, clientX: number, clientY: number) {
    const stagePoint = clientPointToStagePoint(clientX, clientY);
    if (!stagePoint) {
      return constrainImageViewportTransform({ ...transform, scale: nextScale });
    }

    const scale = clamp(nextScale, minImageZoomScale, maxImageZoomScale);
    const localX = (stagePoint.x - imageFrame.left - transform.x) / transform.scale;
    const localY = (stagePoint.y - imageFrame.top - transform.y) / transform.scale;

    return constrainImageViewportTransform({
      scale,
      x: stagePoint.x - imageFrame.left - localX * scale,
      y: stagePoint.y - imageFrame.top - localY * scale,
    });
  }

  function imageGestureDetails() {
    const [firstPointer, secondPointer] = Array.from(activeImagePointersRef.current.values());
    if (!firstPointer || !secondPointer) return undefined;

    const centerClientX = (firstPointer.clientX + secondPointer.clientX) / 2;
    const centerClientY = (firstPointer.clientY + secondPointer.clientY) / 2;
    const centerStagePoint = clientPointToStagePoint(centerClientX, centerClientY);
    if (!centerStagePoint) return undefined;

    return {
      centerX: centerStagePoint.x,
      centerY: centerStagePoint.y,
      distance: distanceBetweenPointers(firstPointer, secondPointer),
    };
  }

  function resetImageGestureSnapshots() {
    imagePanSnapshotRef.current = undefined;
    imagePinchSnapshotRef.current = undefined;
  }

  function handleImageStagePointerDown(event: PointerEvent<HTMLElement>) {
    const isTagStickerPointer = event.target instanceof Element && event.target.closest('.tagSticker');
    if (event.button !== 0 || isTagStickerPointer) return;
    if (imageFrame.width <= 0 || imageFrame.height <= 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activeImagePointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (activeImagePointersRef.current.size >= 2) {
      const details = imageGestureDetails();
      if (details && details.distance > 0) {
        imagePinchSnapshotRef.current = { ...details, transform: imageViewportTransformRef.current };
      }
      imagePanSnapshotRef.current = undefined;
      return;
    }

    imagePanSnapshotRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      transform: imageViewportTransformRef.current,
    };
  }

  function handleImageStagePointerMove(event: PointerEvent<HTMLElement>) {
    if (!activeImagePointersRef.current.has(event.pointerId)) return;

    event.preventDefault();
    activeImagePointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (activeImagePointersRef.current.size >= 2) {
      const details = imageGestureDetails();
      const snapshot = imagePinchSnapshotRef.current;
      if (!details || !snapshot || snapshot.distance <= 0) return;

      const nextScale = snapshot.transform.scale * (details.distance / snapshot.distance);
      const localX = (snapshot.centerX - imageFrame.left - snapshot.transform.x) / snapshot.transform.scale;
      const localY = (snapshot.centerY - imageFrame.top - snapshot.transform.y) / snapshot.transform.scale;

      commitImageViewportTransform({
        scale: nextScale,
        x: details.centerX - imageFrame.left - localX * nextScale,
        y: details.centerY - imageFrame.top - localY * nextScale,
      });
      return;
    }

    const snapshot = imagePanSnapshotRef.current;
    const currentTransform = imageViewportTransformRef.current;
    if (!snapshot || snapshot.pointerId !== event.pointerId || currentTransform.scale <= minImageZoomScale) return;

    commitImageViewportTransform({
      ...currentTransform,
      x: snapshot.transform.x + event.clientX - snapshot.clientX,
      y: snapshot.transform.y + event.clientY - snapshot.clientY,
    });
  }

  function handleImageStagePointerEnd(event: PointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activeImagePointersRef.current.delete(event.pointerId);

    if (activeImagePointersRef.current.size >= 2) {
      const details = imageGestureDetails();
      if (details && details.distance > 0) {
        imagePinchSnapshotRef.current = { ...details, transform: imageViewportTransformRef.current };
      }
      imagePanSnapshotRef.current = undefined;
      return;
    }

    if (activeImagePointersRef.current.size === 1) {
      const [[pointerId, pointer]] = activeImagePointersRef.current;
      imagePanSnapshotRef.current = { pointerId, ...pointer, transform: imageViewportTransformRef.current };
      imagePinchSnapshotRef.current = undefined;
      return;
    }

    resetImageGestureSnapshots();
  }

  function handleImageStageWheel(event: WheelEvent<HTMLElement>) {
    if (imageFrame.width <= 0 || imageFrame.height <= 0) return;

    event.preventDefault();
    const nextScale = imageViewportTransformRef.current.scale * Math.exp(-event.deltaY * wheelZoomSpeed);
    commitImageViewportTransform(
      zoomImageAtClientPoint(imageViewportTransformRef.current, nextScale, event.clientX, event.clientY),
    );
  }

  function coordinateFromPointer(event: PointerEvent<HTMLElement>): TagCoordinate {
    const frameRect = imageFrameRef.current?.getBoundingClientRect();
    if (!frameRect) return createTagCoordinate(0.5, 0.5);

    return pixelToRatio(
      pointToImageRatio({
        clientX: event.clientX,
        clientY: event.clientY,
        imageRect: frameRect,
      }),
    );
  }

  function isPointerInsideImage(event: PointerEvent<HTMLElement>): boolean {
    const frameRect = imageFrameRef.current?.getBoundingClientRect();
    if (!frameRect || frameRect.width <= 0 || frameRect.height <= 0) return false;

    return (
      event.clientX >= frameRect.left &&
      event.clientX <= frameRect.right &&
      event.clientY >= frameRect.top &&
      event.clientY <= frameRect.bottom
    );
  }

  function handleTagSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateTagText(tagText);
    if (error) {
      setDraftError(error);
      return;
    }

    const seed = Date.now();
    setStagedTag({
      id: `staged-tag-${seed}`,
      seed,
      text: tagText.trim(),
      stickerUrl: stickerUrls[seed % stickerUrls.length],
    });
    setTagText('');
    setDraftError(undefined);
  }

  function handleStagedTagPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingStagedTag(true);
    setStagedDragPosition({ x: event.clientX, y: event.clientY });
  }

  function handleStagedTagPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!isDraggingStagedTag) return;
    setStagedDragPosition({ x: event.clientX, y: event.clientY });
  }

  async function handleStagedTagPointerUp(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (stagedTag && isPointerInsideImage(event)) {
      try {
        await submitTextTag(stagedTag.text, coordinateFromPointer(event), stagedTag.seed);
        setStagedTag(undefined);
        setDraftError(undefined);
      } catch {
        setDraftError('태그 저장에 실패했습니다. 다시 놓아주세요.');
      }
    }

    setIsDraggingStagedTag(false);
    setStagedDragPosition(undefined);
  }

  function handleStagedTagPointerCancel() {
    setIsDraggingStagedTag(false);
    setStagedDragPosition(undefined);
  }

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    setImageState('loaded');
    const { naturalHeight, naturalWidth } = event.currentTarget;
    if (naturalHeight > 0 && naturalWidth > 0) {
      setImageAspectRatio(naturalWidth / naturalHeight);
    }
  }

  const visibleErrorMessage = errorMessage ?? tagErrorMessage;

  return (
    <main className="taggingDetailPage">
      <header className="taggingDetailHeader">
        <Link className="taggingBackLink" aria-label="목록으로 돌아가기" to={`/e/${eventId}`}>
          <ChevronLeft size={18} />
          <span>목록</span>
        </Link>
        <h1 className="taggingQuestionTitle">{votePost?.title ?? '질문'}</h1>
        <Link className="taggingDoneButton" to={`/e/${eventId}/thanks`}>
          완료
        </Link>
      </header>

      <TaggingImageArea
        altText={votePost?.altText ?? votePost?.title ?? '태깅 이미지'}
        imageFrameRef={imageFrameRef}
        imageFrameStyle={imageFrameStyle}
        imageStageRef={imageStageRef}
        imageState={isLoading ? 'loading' : imageState}
        imageUrl={votePost?.imageUrl}
        onImageError={() => setImageState('error')}
        onImageLoad={handleImageLoad}
        onStagePointerCancel={handleImageStagePointerEnd}
        onStagePointerDown={handleImageStagePointerDown}
        onStagePointerMove={handleImageStagePointerMove}
        onStagePointerUp={handleImageStagePointerEnd}
        onStageWheel={handleImageStageWheel}
        stickerUrlForTag={stickerUrlForTag}
        tags={tags}
      />

      {visibleErrorMessage && (
        <div className="taggingErrorBanner" role="alert">
          <p>{visibleErrorMessage}</p>
          {errorMessage && (
            <button type="button" onClick={retry}>
              다시 시도
            </button>
          )}
        </div>
      )}
      {isSavingTag && <div className="taggingSaveStatus">태그를 저장하는 중입니다</div>}

      <TaggingInputDock
        draftError={draftError}
        isDraggingStagedTag={isDraggingStagedTag}
        onStagedPointerCancel={handleStagedTagPointerCancel}
        onStagedPointerDown={handleStagedTagPointerDown}
        onStagedPointerMove={handleStagedTagPointerMove}
        onStagedPointerUp={(event) => void handleStagedTagPointerUp(event)}
        onSubmit={handleTagSubmit}
        onTextChange={(value) => {
          setTagText(value);
          setDraftError(undefined);
        }}
        stagedDragPosition={stagedDragPosition}
        stagedTag={stagedTag}
        tagText={tagText}
      />
    </main>
  );
}

function stickerUrlForTag(tag: ParticipantTag): string {
  const seed = tag.stickerSeed ?? (Number(tag.id) || 0);
  return stickerUrls[Math.abs(seed) % stickerUrls.length];
}
