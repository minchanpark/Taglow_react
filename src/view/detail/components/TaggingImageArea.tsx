import type { CSSProperties, PointerEvent, RefObject, SyntheticEvent, WheelEvent } from 'react';

import { TagSticker } from '../../../components/TagSticker';
import type { ParticipantTag } from '../../../api/model';
import './css/TaggingImageArea.css';

interface TaggingImageAreaProps {
  altText: string;
  closedMessage?: string;
  imageFrameRef: RefObject<HTMLDivElement>;
  imageFrameStyle: CSSProperties;
  imageStageRef: RefObject<HTMLDivElement>;
  imageState: 'loading' | 'loaded' | 'error';
  imageUrl?: string;
  isInteractionDisabled?: boolean;
  onImageError(): void;
  onImageLoad(event: SyntheticEvent<HTMLImageElement>): void;
  onStagePointerCancel(event: PointerEvent<HTMLElement>): void;
  onStagePointerDown(event: PointerEvent<HTMLElement>): void;
  onStagePointerMove(event: PointerEvent<HTMLElement>): void;
  onStagePointerUp(event: PointerEvent<HTMLElement>): void;
  onStageWheel(event: WheelEvent<HTMLElement>): void;
  stickerUrlForTag(tag: ParticipantTag): string;
  tags: ParticipantTag[];
}

export function TaggingImageArea({
  altText,
  closedMessage,
  imageFrameRef,
  imageFrameStyle,
  imageStageRef,
  imageState,
  imageUrl,
  isInteractionDisabled = false,
  onImageError,
  onImageLoad,
  onStagePointerCancel,
  onStagePointerDown,
  onStagePointerMove,
  onStagePointerUp,
  onStageWheel,
  stickerUrlForTag,
  tags,
}: TaggingImageAreaProps) {
  const shouldShowLoadingIndicator = !closedMessage && imageState === 'loading';
  const shouldShowMissingImage = !closedMessage && imageState !== 'loading' && !imageUrl;
  const shouldShowImageError = !closedMessage && imageState === 'error' && Boolean(imageUrl);

  return (
    <section
      className={`taggingImageStage${isInteractionDisabled ? ' isInteractionDisabled' : ''}`}
      ref={imageStageRef}
      aria-label="태깅 이미지"
      aria-disabled={isInteractionDisabled}
      onPointerCancel={isInteractionDisabled ? undefined : onStagePointerCancel}
      onPointerDown={isInteractionDisabled ? undefined : onStagePointerDown}
      onPointerMove={isInteractionDisabled ? undefined : onStagePointerMove}
      onPointerUp={isInteractionDisabled ? undefined : onStagePointerUp}
      onWheel={isInteractionDisabled ? undefined : onStageWheel}
    >
      <div className="taggingImageFrame" ref={imageFrameRef} style={imageFrameStyle}>
        {imageUrl ? (
          <img
            className="taggingQuestionImage"
            src={imageUrl}
            alt={altText}
            draggable={false}
            decoding="async"
            onError={onImageError}
            onLoad={onImageLoad}
          />
        ) : shouldShowMissingImage ? (
          <div className="taggingImageNotice error">이미지가 없습니다</div>
        ) : null}

        {shouldShowLoadingIndicator && (
          <div className="taggingImageLoadingIndicator" role="status" aria-live="polite">
            <span className="taggingImageSpinner" aria-hidden="true" />
            <span className="taggingVisuallyHidden">이미지를 불러오는 중입니다</span>
          </div>
        )}
        {shouldShowImageError && <div className="taggingImageNotice error">이미지를 불러오지 못했습니다</div>}

        <div className="taggingStickerLayer" aria-label="이미지 위 태그">
          {tags.map((tag) => (
            <TagSticker
              key={tag.id}
              stickerUrl={stickerUrlForTag(tag)}
              style={
                {
                  '--tag-x': `${tag.coordinate.xRatio * 100}%`,
                  '--tag-y': `${tag.coordinate.yRatio * 100}%`,
                } as CSSProperties
              }
              text={tag.text ?? ''}
              variant="placed"
            />
          ))}
        </div>
      </div>
      {closedMessage && (
        <div className="taggingClosedOverlay" role="status">
          <p>{closedMessage}</p>
        </div>
      )}
    </section>
  );
}
