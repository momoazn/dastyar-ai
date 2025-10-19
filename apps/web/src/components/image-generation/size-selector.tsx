import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { IMAGE_SIZES } from "@/lib/image-generation-constants";
import { fa } from "@/lib/persian-texts";

type SizeSelectorProps = {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

export function SizeSelector({
  value,
  onValueChange,
  className,
}: SizeSelectorProps) {
  return (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger
        className={`h-9 w-36 cursor-pointer gap-2 ${className || ""}`}
      >
        <SelectValue placeholder={fa.imageGeneration.sizePlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {IMAGE_SIZES.map((size) => (
          <SelectItem key={size.label} value={size.value.toString()}>
            {size.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
