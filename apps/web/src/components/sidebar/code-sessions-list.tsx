import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Code } from "lucide-react";
import { Button } from "@/components/ui";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";

export function CodeSessionsList() {
  const { data: sessions, isLoading } = useQuery(
    orpc.code.listSessions.queryOptions()
  );

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground text-sm">
          {fa.navigation.loadingThreads}
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground text-sm">
          هیچ جلسه کدی وجود ندارد
        </div>
        <Link to="/code">
          <Button className="mt-2 w-full" size="sm">
            <Code className="ml-2 h-4 w-4" />
            جلسه جدید
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-muted-foreground text-sm">جلسات کد</h3>
        <Link to="/code">
          <Button size="sm" variant="ghost">
            <Code className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="space-y-1">
        {sessions.slice(0, 10).map((session) => (
          <Link
            className="block"
            key={session.id}
            params={{ id: session.id.toString() }}
            to="/code/$id"
          >
            <div className="group flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent">
              <Code className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{session.title}</div>
                <div className="text-muted-foreground text-xs">
                  {session.language} • {formatDate(session.createdAt)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {sessions.length > 10 && (
        <div className="mt-2 text-center">
          <Link to="/code">
            <Button className="text-xs" size="sm" variant="ghost">
              مشاهده همه ({sessions.length})
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
