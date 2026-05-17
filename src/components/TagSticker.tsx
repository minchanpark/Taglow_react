import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import dialogIconUrl from '../assets/icon/dialog_icon.svg';
import './TagSticker.css';

interface TagStickerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  stickerUrl: string;
  variant: 'placed' | 'staged';
  isDragging?: boolean;
}

type DialogHorizontalDirection = 'right' | 'left';
type DialogVerticalDirection = 'above' | 'below';

const DEFAULT_DIALOG_TAIL_X_RATIO = 0.1065;
const DEFAULT_DIALOG_TAIL_Y_RATIO = 0.967;
const DIALOG_EDGE_PADDING = 4;

function parsePercentRatio(value: string, fallback: number) {
  const percent = Number.parseFloat(value);
  return Number.isFinite(percent) ? percent / 100 : fallback;
}

function overflowAmount(start: number, end: number, min: number, max: number) {
  return Math.max(0, min - start) + Math.max(0, end - max);
}

export function TagSticker({
  className = '',
  isDragging = false,
  stickerUrl,
  text,
  variant,
  ...buttonProps
}: TagStickerProps) {
  const accessibleLabel = buttonProps['aria-label'] ?? text ?? '태그 스티커';
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isContentOpen, setIsContentOpen] = useState(false);
  const [dialogHorizontalDirection, setDialogHorizontalDirection] =
    useState<DialogHorizontalDirection>('right');
  const [dialogVerticalDirection, setDialogVerticalDirection] = useState<DialogVerticalDirection>('above');
  const canShowContent = variant === 'placed' && Boolean(text.trim());
  const isDialogOpen = canShowContent && isContentOpen;

  const updateDialogDirection = useCallback(() => {
    const buttonElement = buttonRef.current;
    if (!buttonElement || !isDialogOpen) return;

    const layerElement = buttonElement.closest<HTMLElement>('.taggingStickerLayer');
    const layerRect = layerElement?.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const minX = (layerRect?.left ?? 0) + DIALOG_EDGE_PADDING;
    const maxX = (layerRect?.right ?? visualViewport?.width ?? window.innerWidth) - DIALOG_EDGE_PADDING;
    const minY = (layerRect?.top ?? 0) + DIALOG_EDGE_PADDING;
    const maxY = (layerRect?.bottom ?? visualViewport?.height ?? window.innerHeight) - DIALOG_EDGE_PADDING;
    const dialogRect = buttonElement.getBoundingClientRect();
    const dialogWidth = dialogRect.width;
    const dialogHeight = dialogRect.height;

    if (dialogWidth <= 0 || dialogHeight <= 0 || maxX <= minX || maxY <= minY) return;

    const computedStyle = getComputedStyle(buttonElement);
    const tagXRatio = parsePercentRatio(computedStyle.getPropertyValue('--tag-x'), 0.5);
    const tagYRatio = parsePercentRatio(computedStyle.getPropertyValue('--tag-y'), 0.5);
    const tailXRatio = parsePercentRatio(
      computedStyle.getPropertyValue('--tag-dialog-tail-x'),
      DEFAULT_DIALOG_TAIL_X_RATIO,
    );
    const tailYRatio = parsePercentRatio(
      computedStyle.getPropertyValue('--tag-dialog-tail-y'),
      DEFAULT_DIALOG_TAIL_Y_RATIO,
    );
    const anchorX = layerRect ? layerRect.left + layerRect.width * tagXRatio : dialogRect.left + dialogWidth / 2;
    const anchorY = layerRect ? layerRect.top + layerRect.height * tagYRatio : dialogRect.top + dialogHeight / 2;

    const rightStart = anchorX - dialogWidth * tailXRatio;
    const leftStart = anchorX - dialogWidth * (1 - tailXRatio);
    const rightOverflow = overflowAmount(rightStart, rightStart + dialogWidth, minX, maxX);
    const leftOverflow = overflowAmount(leftStart, leftStart + dialogWidth, minX, maxX);
    const nextHorizontalDirection: DialogHorizontalDirection = rightOverflow <= leftOverflow ? 'right' : 'left';

    const aboveStart = anchorY - dialogHeight * tailYRatio;
    const belowStart = anchorY - dialogHeight * (1 - tailYRatio);
    const aboveOverflow = overflowAmount(aboveStart, aboveStart + dialogHeight, minY, maxY);
    const belowOverflow = overflowAmount(belowStart, belowStart + dialogHeight, minY, maxY);
    const nextVerticalDirection: DialogVerticalDirection = aboveOverflow <= belowOverflow ? 'above' : 'below';

    setDialogHorizontalDirection(nextHorizontalDirection);
    setDialogVerticalDirection(nextVerticalDirection);
  }, [isDialogOpen]);

  useLayoutEffect(() => {
    if (!isDialogOpen) {
      setDialogHorizontalDirection('right');
      setDialogVerticalDirection('above');
      return;
    }

    updateDialogDirection();
    window.addEventListener('resize', updateDialogDirection);
    return () => window.removeEventListener('resize', updateDialogDirection);
  }, [isDialogOpen, text, updateDialogDirection]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    buttonProps.onClick?.(event);
    if (event.defaultPrevented || !canShowContent) return;
    setIsContentOpen((current) => !current);
  }

  return (
    <button
      className={`tagSticker tagSticker-marker tagSticker-${variant} ${isDragging ? 'dragging' : ''} ${
        isDialogOpen ? `isDialogOpen isDialog-${dialogHorizontalDirection} isDialog-${dialogVerticalDirection}` : ''
      } ${className}`.trim()}
      ref={buttonRef}
      type="button"
      {...buttonProps}
      aria-label={accessibleLabel}
      aria-expanded={canShowContent ? isDialogOpen : undefined}
      onClick={handleClick}
    >
      {isDialogOpen ? (
        <span className="tagStickerDialog">
          <img className="tagStickerDialogImage" alt="" draggable={false} src={dialogIconUrl} />
          <span className="tagStickerContent">{text}</span>
        </span>
      ) : (
        <img className="tagStickerIcon" alt="" draggable={false} src={stickerUrl} />
      )}
    </button>
  );
}
