import {
  Content as SelectContentRadix,
  Group as SelectGroupRadix,
  Icon as SelectIcon,
  ItemIndicator as SelectItemIndicator,
  Item as SelectItemRadix,
  ItemText as SelectItemText,
  Label as SelectLabelRadix,
  Portal as SelectPortal,
  Root as SelectRoot,
  ScrollDownButton as SelectScrollDownButtonRadix,
  ScrollUpButton as SelectScrollUpButtonRadix,
  Separator as SelectSeparatorRadix,
  Trigger as SelectTriggerRadix,
  Value as SelectValueRadix,
  Viewport as SelectViewport,
} from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Select({ ...props }: React.ComponentProps<typeof SelectRoot>) {
  return <SelectRoot data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectGroupRadix>) {
  return <SelectGroupRadix data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectValueRadix>) {
  return <SelectValueRadix data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectTriggerRadix> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectTriggerRadix
      className={cn(
        "flex w-fit items-center justify-between gap-2 whitespace-nowrap rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm shadow-xs outline-none transition-[color,box-shadow] hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[size=default]:h-9 data-[size=sm]:h-8 data-[placeholder]:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input dark:aria-invalid:ring-destructive/40 dark:hover:bg-accent [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-size={size}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectIcon asChild>
        <ChevronDownIcon className="size-4 opacity-70" />
      </SelectIcon>
    </SelectTriggerRadix>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectContentRadix>) {
  return (
    <SelectPortal>
      <SelectContentRadix
        className={cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in",
          position === "popper" &&
            "data-[side=left]:-translate-x-1 data-[side=top]:-translate-y-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1",
          className
        )}
        data-slot="select-content"
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectViewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectViewport>
        <SelectScrollDownButton />
      </SelectContentRadix>
    </SelectPortal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectLabelRadix>) {
  return (
    <SelectLabelRadix
      className={cn("px-2 py-1.5 text-muted-foreground text-xs", className)}
      data-slot="select-label"
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectItemRadix>) {
  return (
    <SelectItemRadix
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      data-slot="select-item"
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectItemIndicator>
          <CheckIcon className="size-4" />
        </SelectItemIndicator>
      </span>
      <SelectItemText>{children}</SelectItemText>
    </SelectItemRadix>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectSeparatorRadix>) {
  return (
    <SelectSeparatorRadix
      className={cn("-mx-1 pointer-events-none my-1 h-px bg-border", className)}
      data-slot="select-separator"
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectScrollUpButtonRadix>) {
  return (
    <SelectScrollUpButtonRadix
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      data-slot="select-scroll-up-button"
      {...props}
    >
      <ChevronUpIcon className="size-4 opacity-70" />
    </SelectScrollUpButtonRadix>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectScrollDownButtonRadix>) {
  return (
    <SelectScrollDownButtonRadix
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      data-slot="select-scroll-down-button"
      {...props}
    >
      <ChevronDownIcon className="size-4 opacity-70" />
    </SelectScrollDownButtonRadix>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
