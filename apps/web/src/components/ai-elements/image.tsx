import type { Experimental_GeneratedImage } from 'ai';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
  style?: CSSProperties;
};

export const Image = ({
  base64,
  uint8Array,
  mediaType,
  ...props
}: ImageProps) => (
  <img
    {...props}
    alt={props.alt}
    className={cn(
      'h-auto max-w-full overflow-hidden rounded-md',
      props.className
    )}
    src={`data:${mediaType};base64,${base64}`}
    style={props.style}
  />
);
