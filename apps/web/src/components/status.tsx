import { Brain, ImageIcon, type LucideIcon } from 'lucide-react';

export function Status() {
  return (
    <header className="flex gap-2">
      <StatusItem icon={Brain} name="Ollama" status={true} />

      <StatusItem icon={ImageIcon} name="Stable Diffusion" status={false} />
    </header>
  );
}

interface StatusItemProps {
  name: string;
  icon: LucideIcon;
  status: boolean;
}

function StatusItem({ name, icon: Icon, status }: StatusItemProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded px-2 py-1.5 ${
        status
          ? 'bg-primary/10 text-primary'
          : 'bg-destructive/10 text-destructive'
      }`}
    >
      <span className="mt-0.5 hidden text-xs lg:block">{name}</span>
      <Icon className="h-4 w-4" />
    </div>
  );
}
