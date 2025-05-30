import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { MessagesRecord } from "@/lib/pocketbase-types";
import { detectTextDirection } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

export interface UserMessageProps {
  message: MessagesRecord;
  onCopy?: (content: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

export function UserMessage({ message, onCopy, onEdit }: UserMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      onCopy?.(content);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content || "");
  };

  // User message actions below content
  const UserMessageActions = () => (
    <TooltipProvider>
      <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-md p-0"
              onClick={() => handleCopy(message.content || "")}
            >
              {copySuccess ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {copySuccess
                ? PERSIAN_TEXTS.chat.copied
                : PERSIAN_TEXTS.chat.copy}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  return (
    <div className="group flex w-full justify-end">
      <div className="max-w-[85%]">
        <div className="rounded-2xl bg-blue-600 px-4 py-3 text-white">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] border-blue-500 bg-blue-700 text-white placeholder:text-blue-200"
                dir={detectTextDirection(editContent)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCancelEdit}
                  className="h-7 px-3 text-xs"
                >
                  {PERSIAN_TEXTS.chat.cancel}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-7 bg-white px-3 text-xs text-blue-600 hover:bg-blue-50"
                >
                  {PERSIAN_TEXTS.chat.save}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                dir={detectTextDirection(message.content || "")}
                className="text-sm leading-relaxed"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content || ""}
                </ReactMarkdown>
              </div>

              {/* Message timestamp */}
              {message.sent_at && (
                <div className="mt-2">
                  <time className="text-xs text-blue-200">
                    {new Date(message.sent_at).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions below message bubble */}
        {!isEditing && <UserMessageActions />}
      </div>
    </div>
  );
}
