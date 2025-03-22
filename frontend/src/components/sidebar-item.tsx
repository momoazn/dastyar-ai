import { MessageSquare, Pencil, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { Button, Input } from "@/components/ui";
import { Conversation, useUpdateConversation } from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

interface SidebarItemProps {
  conversation: Conversation;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isDeletingConversation: boolean;
}

export function SidebarItem({
  conversation,
  onDelete,
  isDeletingConversation,
}: SidebarItemProps) {
  const { pathname } = useLocation();
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: updateConversation } = useUpdateConversation({
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  const pathnameRegex = new RegExp(
    `^/threads/${conversation.id}/(chat|image|translate)$`,
  );
  const isActive = pathnameRegex.test(pathname);

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      updateConversation({ id: conversation.id, title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(conversation.title);
    }
  };

  return (
    <NavLink
      key={conversation.id}
      to={`/threads/${conversation.id}/chat`}
      className={cn(
        "flex h-10 items-center justify-between gap-2 text-wrap rounded-md px-2 ps-2 text-sm text-muted-foreground",
        isActive ? "bg-primary/10 text-primary" : "",
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={(e) => isEditing && e.preventDefault()}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <MessageSquare className="h-4 w-4 shrink-0" />
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-6 rounded-sm text-sm"
            onClick={(e) => e.preventDefault()}
          />
        ) : (
          <span className="truncate">
            {conversation.title
              ? conversation.title.length > 25
                ? conversation.title.slice(0, 25) + "..."
                : conversation.title
              : PERSIAN_TEXTS.navigation.newChat}
          </span>
        )}
      </div>
      {isHovering && !isEditing && (
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
              setEditTitle(conversation.title);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="h-6 w-6 bg-transparent hover:bg-transparent hover:text-blue-500"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeletingConversation}
            className="h-6 w-6 bg-transparent hover:bg-transparent hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </NavLink>
  );
}
