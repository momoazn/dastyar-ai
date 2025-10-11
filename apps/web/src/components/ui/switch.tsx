import { Root, Thumb } from "@radix-ui/react-switch";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof Root>) {
  return (
    <Root
      className={cn(
        "peer inline-flex h-5 w-10 shrink-0 items-center justify-start rounded-full border border-transparent px-0.5 shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:justify-end data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
        className
      )}
      data-slot="switch"
      {...props}
    >
      <Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground"
        )}
        data-slot="switch-thumb"
      />
    </Root>
  );
}

export { Switch };
