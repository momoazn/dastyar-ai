import { ConnectionStatus } from "@/context/service-context";
import { Status } from "./status";

export function Header({
  connectionsStatus,
}: {
  connectionsStatus: ConnectionStatus;
}) {
  return (
    <header className="flex h-12 items-center justify-between border-b p-4">
      <h1 className="text-xl font-semibold">دستیار هوشمند</h1>
      <Status connectionsStatus={connectionsStatus} />
    </header>
  );
}
