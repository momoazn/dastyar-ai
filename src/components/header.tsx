import { ConnectionStatus } from "@/context/service-context";
import { Status } from "./status";

export function Header({
  connectionsStatus,
}: {
  connectionsStatus: ConnectionStatus;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b p-4">
      <h1 className="text-2xl font-semibold text-blue-900">دستیار هوشمند</h1>
      <Status connectionsStatus={connectionsStatus} />
    </header>
  );
}
