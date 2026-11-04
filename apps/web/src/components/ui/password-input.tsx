import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  showPasswordAriaLabel: string;
  hidePasswordAriaLabel: string;
}

function PasswordInput({
  className,
  disabled,
  showPasswordAriaLabel,
  hidePasswordAriaLabel,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        className={`pe-12 ${className || ""}`}
        disabled={disabled}
        type={showPassword ? "text" : "password"}
        {...props}
      />
      <Button
        aria-label={
          showPassword ? hidePasswordAriaLabel : showPasswordAriaLabel
        }
        className="-translate-y-1/2 absolute end-1 top-1/2 size-8 text-muted-foreground hover:text-foreground"
        disabled={disabled}
        onClick={() => setShowPassword((prev) => !prev)}
        size="icon"
        tabIndex={-1}
        type="button"
        variant="ghost"
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        <span className="sr-only">
          {showPassword ? hidePasswordAriaLabel : showPasswordAriaLabel}
        </span>
      </Button>
    </div>
  );
}

export { PasswordInput };
