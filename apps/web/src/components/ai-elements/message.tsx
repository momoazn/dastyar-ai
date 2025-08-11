import type { UIMessage } from 'ai';
import type { ComponentProps, HTMLAttributes } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full items-end gap-2 py-4 rtl:space-x-reverse',
      from === 'user'
        ? 'is-user flex-row-reverse justify-end'
        : 'is-assistant justify-start',
      className
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'bubble' | 'plain';
};

export const MessageContent = ({
  children,
  className,
  variant = 'bubble',
  ...props
}: MessageContentProps) => {
  const bubbleClasses = cn(
    'flex max-w-[80%] flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-foreground text-sm',
    'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground',
    'group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground'
  );

  const plainClasses = cn('w-full text-foreground text-sm');

  return (
    <div
      className={cn(
        variant === 'bubble' ? bubbleClasses : plainClasses,
        className
      )}
      {...props}
    >
      <div className="is-user:dark">{children}</div>
    </div>
  );
};

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string;
  name?: string;
};

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar className={cn('size-8 ring ring-border', className)} {...props}>
    <AvatarImage alt={name ?? 'avatar'} className="mt-0 mb-0" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || 'ME'}</AvatarFallback>
  </Avatar>
);
