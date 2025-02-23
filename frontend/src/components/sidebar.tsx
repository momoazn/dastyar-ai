import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SettingsModal } from "./settings-modal";
import { ChatService, Session } from "@/services/chat";
import { useServices } from "@/context/service-context";
import { useNavigate, NavLink } from "react-router-dom";

export function Sidebar() {
  const { current: chatService } = useRef(new ChatService());

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  const { setSelectedSession } = useServices();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      const sessions = await chatService.getAllSessions();
      setSessions(sessions);
      // if (sessions.length > 0 && !selectedSession) {
      //   setSelectedSession(sessions[0]);
      // }
    };

    fetchSessions();
  }, []);

  const createSession = async () => {
    const session = await chatService.createSession("New Chat");
    setSessions([...sessions, session]);
    setSelectedSession(session);
    navigate(`/chat/${session.id}`);
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l border-r transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-[50px]" : "w-[340px]",
      )}
    >
      {/* Header section */}
      <div
        className={cn(
          "flex h-16 items-center justify-between border-b p-4",
          isCollapsed ? "flex-col" : "flex-row",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronsLeft className="h-4 w-4" />
          ) : (
            <ChevronsRight className="h-4 w-4" />
          )}
        </Button>
        <Button variant="default" size="icon" onClick={createSession}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat list section */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-2">
          {!isCollapsed && (
            <>
              {sessions.map((session) => (
                <NavLink
                  key={session.id}
                  to={`/chat/${session.id}`}
                  className={({ isActive }) =>
                    cn(
                      "flex h-10 items-center justify-start rounded-md border bg-muted/50 px-4 pt-1",
                      isActive ? "bg-primary/10 text-primary" : "",
                    )
                  }
                >
                  {session.title ?? "New Chat"}
                </NavLink>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer with settings button */}
      <div className="flex h-12 items-center justify-end border-t p-4">
        {!isCollapsed && <SettingsModal />}
      </div>
    </div>
  );
}
