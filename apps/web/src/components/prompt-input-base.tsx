import { useMemo } from "react";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { detectTextDirection } from "@/lib/utils";

type SubmitProps = {
  disabled?: boolean;
  status?: "streaming" | "submitted" | undefined;
  variant?: "default" | "destructive" | "secondary" | undefined;
};

type PromptInputBaseProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating?: boolean;
  onStop?: () => void;
  placeholder: string;
  dir?: "rtl" | "ltr";
  leftTools?: React.ReactNode;
  rightTools?: React.ReactNode;
  submitProps?: SubmitProps;
  bottomContent?: React.ReactNode;
};

export function PromptInputBase({
  value,
  onChange,
  onSubmit,
  isGenerating,
  onStop,
  placeholder,
  dir,
  leftTools,
  rightTools,
  submitProps,
  bottomContent,
}: PromptInputBaseProps) {
  const textDirection = useMemo(
    () => dir ?? (value ? detectTextDirection(value) : "rtl"),
    [dir, value]
  );

  const disabledDefault = isGenerating || !value.trim();
  const submit = () => {
    if (isGenerating) {
      onStop?.();
      return;
    }
    if (!value.trim()) {
      return;
    }
    onSubmit();
  };

  return (
    <PromptInput
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <PromptInputTextarea
        dir={textDirection}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        value={value}
      />
      <PromptInputToolbar>
        <PromptInputTools>{leftTools}</PromptInputTools>
        <div className="flex items-center gap-2">
          {rightTools}
          <PromptInputSubmit
            disabled={submitProps?.disabled ?? disabledDefault}
            status={submitProps?.status}
            variant={submitProps?.variant}
          />
        </div>
      </PromptInputToolbar>
      {bottomContent}
    </PromptInput>
  );
}
