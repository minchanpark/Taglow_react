import { ChevronLeft } from 'lucide-react';
import type { CSSProperties, FormEvent, PointerEvent, SyntheticEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useTaggingDetailController } from '../../api/controller/useTaggingDetailController';
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

export function TaggingDetailPage() {
  const { eventId = '11', votePostId = '31' } = useParams();
  const { errorMessage, isLoading, isSavingTag, retry, submitTextTag, tagErrorMessage, tags, votePost } =
    useTaggingDetailController({ eventId, votePostId });
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const imageStageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [imageAspectRatio, setImageAspectRatio] = useState(votePost?.imageRatio ?? fallbackImageAspectRatio);
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [tagText, setTagText] = useState('');
  const [draftError, setDraftError] = useState<string>();
  const [stagedTag, setStagedTag] = useState<StagedStickerTag>();
  const [stagedDragPosition, setStagedDragPosition] = useState<DragPosition>();
  const [isDraggingStagedTag, setIsDraggingStagedTag] = useState(false);

  useEffect(() => {
    setImageAspectRatio(votePost?.imageRatio ?? fallbackImageAspectRatio);
    setImageState(votePost?.imageUrl ? 'loading' : 'error');
    setTagText('');
    setDraftError(undefined);
    setStagedTag(undefined);
    setStagedDragPosition(undefined);
    setIsDraggingStagedTag(false);
  }, [votePost?.id, votePost?.imageRatio, votePost?.imageUrl]);

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
  } satisfies CSSProperties;

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
    <main className="mobileFrame taggingDetailPage">
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
