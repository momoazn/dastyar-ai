import type { Experimental_GeneratedImage } from "ai";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
  style?: CSSProperties;
  height?: number;
  width?: number;
};

export const Image = ({
  base64,
  uint8Array,
  mediaType,
  height,
  width,
  ...props
}: ImageProps) => (
  <img
    {...props}
    alt={props.alt}
    className={cn(
      "h-auto max-w-full overflow-hidden rounded-md",
      props.className
    )}
    height={height || "auto"}
    src={`data:${mediaType};base64,${base64}`}
    style={props.style}
    width={width || "auto"}
  />
);
