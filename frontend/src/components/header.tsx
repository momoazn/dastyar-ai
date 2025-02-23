import { ConnectionStatus } from "@/context/service-context";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Status } from "./status";
import { ThemeToggle } from "./ui/theme-toggle";

export function Header({
  connectionsStatus,
}: {
  connectionsStatus: ConnectionStatus;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b p-4">
      <h1 className="text-2xl font-semibold text-primary">
        {PERSIAN_TEXTS.navigation.appTitle}
      </h1>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Status connectionsStatus={connectionsStatus} />
      </div>
    </header>
  );
}
