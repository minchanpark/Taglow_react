import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { useState } from 'react';

import dialogIconUrl from '../assets/icon/dialog_icon.svg';
import './TagSticker.css';

interface TagStickerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  stickerUrl: string;
  variant: 'placed' | 'staged';
  isDragging?: boolean;
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
  const [isContentOpen, setIsContentOpen] = useState(false);
  const canShowContent = variant === 'placed' && Boolean(text.trim());
  const isDialogOpen = canShowContent && isContentOpen;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    buttonProps.onClick?.(event);
    if (event.defaultPrevented || !canShowContent) return;
    setIsContentOpen((current) => !current);
  }

  return (
    <button
      className={`tagSticker tagSticker-${variant} ${isDragging ? 'dragging' : ''} ${
        isDialogOpen ? 'isDialogOpen' : ''
      } ${className}`.trim()}
      type="button"
      {...buttonProps}
      aria-label={accessibleLabel}
      aria-expanded={canShowContent ? isDialogOpen : undefined}
      onClick={handleClick}
    >
      <img alt="" draggable={false} src={isDialogOpen ? dialogIconUrl : stickerUrl} />
      {isDialogOpen && <span className="tagStickerContent">{text}</span>}
    </button>
  );
}
