import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bug, Code, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui";
import { fa } from "@/lib/texts";
import { makeTitle } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export function CodeRunsList() {
  const { data: runs, isLoading } = useQuery(orpc.code.listRuns.queryOptions());

  if (isLoading) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        {fa.general.loadingWithDots}
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground text-sm">
          {fa.general.noItems}
        </div>
        <Link to="/code/">
          <Button className="mt-2 w-full" size="sm">
            <Code className="ml-2 h-4 w-4" />
            {fa.general.startNew}
          </Button>
        </Link>
      </div>
    );
  }

  const iconFor = (mode: string) => {
    if (mode === "explain") {
      return FileText;
    }
    if (mode === "review") {
      return Shield;
    }
    if (mode === "debug") {
      return Bug;
    }
    return Code;
  };

  const formatDate = (d: string | Date) => {
    const when = typeof d === "string" ? new Date(d) : d;
    return when.toLocaleDateString("fa-IR", { month: "short", day: "2-digit" });
  };

  const getRunTitle = (inputCode: string | null | undefined, mode: string) => {
    const preview = (inputCode ?? "").trim();
    if (!preview) {
      return mode;
    }

    return makeTitle(preview, 30);
  };

  return (
    <div className="p-2">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-muted-foreground text-sm">
          {fa.general.history}
        </h3>
        <Link to="/code/">
          <Button size="sm" variant="ghost">
            <Code className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="space-y-1">
        {runs.slice(0, 10).map((run) => {
          const Icon = iconFor(run.mode);
          return (
            <Link
              className="block"
              key={run.id}
              params={{ runId: String(run.id) }}
              to="/code/$runId"
            >
              <div className="group flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {getRunTitle(run.inputCode, run.mode)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {run.language} • {formatDate(run.createdAt)}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
