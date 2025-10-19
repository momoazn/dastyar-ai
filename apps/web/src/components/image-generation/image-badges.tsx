import { Badge } from "@/components/ui";
import type { GenerationSettings } from "@/server/procedures/images";

type ImageBadgesProps = {
  settings: GenerationSettings;
};

export function ImageBadges({ settings }: ImageBadgesProps) {
  return (
    <div className="pointer-events-none absolute right-2 bottom-2 flex flex-wrap gap-2">
      <Badge variant="secondary">
        {settings.width}×{settings.height}
      </Badge>
      <Badge variant="secondary">{String(settings.sampler)}</Badge>
      <Badge variant="secondary">steps: {Number(settings.steps)}</Badge>
      <Badge variant="secondary">cfg: {Number(settings.cfgScale)}</Badge>
    </div>
  );
}
