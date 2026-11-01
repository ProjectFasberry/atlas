import { Avatar as KitAvatar } from '@repo/ui';
import { tv, type VariantProps } from 'tailwind-variants';

export const avatarVariants = tv({
  base: 'border-white/10',
  variants: {
    variant: {
      default: 'size-16',
    },
  },
});

type AvatarProps = {
  className?: string;
  variant?: VariantProps<typeof avatarVariants>['variant'];
  nickname?: string;
  url: string;
};

/** Player head from the shared kit, the app only adds its palette and size. */
export const Avatar = ({ className, variant, url, nickname }: AvatarProps) => (
  <KitAvatar url={url} nickname={nickname} className={avatarVariants({ variant, className })} />
);
