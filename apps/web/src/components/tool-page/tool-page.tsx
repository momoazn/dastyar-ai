import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Surface,
  SurfaceContent,
  SurfaceHeader,
  SurfaceTitle,
} from "@/components/ui";
import { fa } from "@/lib/texts";
import { cn, formatModelName } from "@/lib/utils";

/** Primary action button classes: full width on mobile, readable label when disabled. */
export const PRIMARY_ACTION_CLASS =
  "w-full min-w-[160px] gap-2 sm:w-auto disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:border";

/** Page title with a one-line description. */
export function ToolPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-bold text-2xl">{title}</h1>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </div>
  );
}

/** Titled card that holds the tool settings (selects). */
export function ToolSettings({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Surface padded={false}>
      <SurfaceHeader className="border-b bg-muted/30">
        <SurfaceTitle>{title}</SurfaceTitle>
      </SurfaceHeader>
      <SurfaceContent
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
      >
        {children}
      </SurfaceContent>
    </Surface>
  );
}

/** Label above a control. */
export function SettingField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="font-medium text-sm">{label}</div>
      {children}
    </div>
  );
}

/** Model name as plain text with a full-name tooltip; truncates with an ellipsis. */
export function ModelName({
  identifier,
  className,
}: {
  identifier: string;
  className?: string;
}) {
  return (
    <span
      className={cn("block min-w-0 truncate text-start", className)}
      dir="ltr"
      title={identifier}
    >
      {formatModelName(identifier)}
    </span>
  );
}

type ModelSelectProps = {
  label: string;
  models: Array<{ id: number; identifier: string }> | undefined;
  modelId: number | null | undefined;
  isLoading: boolean;
  disabled?: boolean;
  onChange: (id: number) => void;
};

/** Controlled model select that shows short names and truncates safely. */
export function ModelSelect({
  label,
  models,
  modelId,
  isLoading,
  disabled,
  onChange,
}: ModelSelectProps) {
  return (
    <SettingField label={label}>
      <Select
        disabled={disabled || isLoading}
        onValueChange={(value) => onChange(Number(value))}
        value={modelId ? String(modelId) : ""}
      >
        <SelectTrigger className="w-full min-w-0 text-right" dir="rtl">
          <SelectValue
            className="min-w-0"
            placeholder={
              isLoading ? fa.general.loadingModels : fa.general.selectModel
            }
          />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {models?.map((m) => (
            <SelectItem className="text-right" key={m.id} value={String(m.id)}>
              <ModelName identifier={m.identifier} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingField>
  );
}

/** Read-only value box used on detail pages. */
export function ReadOnlyField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <SettingField label={label}>
      <div className="min-w-0 rounded-md border bg-muted px-3 py-2 text-right text-sm">
        {children}
      </div>
    </SettingField>
  );
}

/** Two-column input/output grid. Input first (right in RTL, top on mobile). */
export function ToolGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
      {children}
    </div>
  );
}

/** Panel with a header (title + actions) and a body. */
export function ToolPanel({
  title,
  actions,
  footer,
  bodyClassName,
  children,
}: {
  title: string;
  actions?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <Surface className="flex min-w-0 flex-col" padded={false}>
      <div className="border-b bg-muted/30 px-4 py-2.5">
        <div className="flex h-8 items-center justify-between gap-2">
          <span className="font-semibold text-foreground text-sm">{title}</span>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
      <div
        className={cn("flex min-h-[300px] flex-1 flex-col p-4", bodyClassName)}
      >
        {children}
      </div>
      {footer}
    </Surface>
  );
}

/** Muted centered hint for empty output areas. */
export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-4 text-center text-muted-foreground text-sm">
      {children}
    </div>
  );
}
