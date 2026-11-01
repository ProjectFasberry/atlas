import type { ImgHTMLAttributes } from 'react';
import { cn } from './cn';

/** Steve head from the public volume: the fallback for a missing or broken skin. */
export const AVATAR_FALLBACK = 'https://volume.fasberry.fun/static/fallback/steve_head.png';

type AvatarProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> & {
  /** Head of the player skin, `null` or an empty string shows the fallback. */
  url?: string | null;
  nickname?: string;
  className?: string;
};

/**
 * Square player head for every app: the image is clipped by the container, a broken or
 * missing skin falls back to Steve, including images that failed before hydration.
 */
export function Avatar({ url, nickname, className, alt, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative block aspect-square select-none overflow-hidden rounded-sm border bg-black/10',
        className,
      )}
    >
      <img
        ref={(image) => {
          if (image?.complete && image.naturalWidth === 0) image.src = AVATAR_FALLBACK;
        }}
        src={url || AVATAR_FALLBACK}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = AVATAR_FALLBACK;
        }}
        alt={alt ?? nickname ?? ''}
        loading="eager"
        className="absolute inset-0 size-full object-cover [image-rendering:pixelated]"
        {...props}
      />
    </span>
  );
}
