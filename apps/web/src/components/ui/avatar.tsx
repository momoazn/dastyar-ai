import {
  Fallback as AvatarFallbackPrimitive,
  Image as AvatarImagePrimitive,
  Root as AvatarRoot,
} from '@radix-ui/react-avatar';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarRoot> {}

const Avatar = forwardRef<React.ElementRef<typeof AvatarRoot>, AvatarProps>(
  ({ className, ...props }, ref) => (
    <AvatarRoot
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Avatar.displayName = 'Avatar';

export interface AvatarImageProps
  extends React.ComponentPropsWithoutRef<typeof AvatarImagePrimitive> {}

const AvatarImage = forwardRef<
  React.ElementRef<typeof AvatarImagePrimitive>,
  AvatarImageProps
>(({ className, ...props }, ref) => (
  <AvatarImagePrimitive
    className={cn('aspect-square size-full', className)}
    ref={ref}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarFallbackPrimitive> {}

const AvatarFallback = forwardRef<
  React.ElementRef<typeof AvatarFallbackPrimitive>,
  AvatarFallbackProps
>(({ className, ...props }, ref) => (
  <AvatarFallbackPrimitive
    className={cn(
      'flex size-full items-center justify-center rounded-full bg-muted',
      className
    )}
    ref={ref}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
