import type { CSSProperties, FormEvent, KeyboardEvent, PointerEvent } from 'react';

import { TagSticker } from '../../../components/TagSticker';
import './css/TaggingInputDock.css';

interface StagedStickerViewModel {
  text: string;
  stickerUrl: string;
}

interface DragPosition {
  x: number;
  y: number;
}

interface TaggingInputDockProps {
  draftError?: string;
  isDraggingStagedTag: boolean;
  onStagedPointerCancel(): void;
  onStagedPointerDown(event: PointerEvent<HTMLButtonElement>): void;
  onStagedPointerMove(event: PointerEvent<HTMLButtonElement>): void;
  onStagedPointerUp(event: PointerEvent<HTMLButtonElement>): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
  onTextChange(value: string): void;
  stagedDragPosition?: DragPosition;
  stagedTag?: StagedStickerViewModel;
  tagText: string;
}

export function TaggingInputDock({
  draftError,
  isDraggingStagedTag,
  onStagedPointerCancel,
  onStagedPointerDown,
  onStagedPointerMove,
  onStagedPointerUp,
  onSubmit,
  onTextChange,
  stagedDragPosition,
  stagedTag,
  tagText,
}: TaggingInputDockProps) {
  if (stagedTag) {
    return (
      <div className="taggingStagedDock">
        <TagSticker
          isDragging={isDraggingStagedTag}
          onPointerCancel={onStagedPointerCancel}
          onPointerDown={onStagedPointerDown}
          onPointerMove={onStagedPointerMove}
          onPointerUp={onStagedPointerUp}
          stickerUrl={stagedTag.stickerUrl}
          style={
            stagedDragPosition
              ? ({
                  '--drag-x': `${stagedDragPosition.x}px`,
                  '--drag-y': `${stagedDragPosition.y}px`,
                } as CSSProperties)
              : undefined
          }
          text={stagedTag.text}
          variant="staged"
        />
      </div>
    );
  }

  return (
    <form className="taggingInputBar" onSubmit={onSubmit}>
      <input
        id="tagText"
        maxLength={100}
        onChange={(event) => onTextChange(event.target.value)}
        onKeyDown={preventComposingEnter}
        placeholder="(예시) 나라 이름 - 이유를 작성해주세요"
        type="text"
        value={tagText}
      />
      {draftError && <p className="taggingInputError">{draftError}</p>}
    </form>
  );
}

function preventComposingEnter(event: KeyboardEvent<HTMLInputElement>): void {
  if (event.key === 'Enter' && event.nativeEvent.isComposing) {
    event.preventDefault();
  }
}
