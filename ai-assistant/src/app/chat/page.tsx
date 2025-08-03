"use client";

import React, { useCallback, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import {
  BotIcon,
  Send,
  Pause,
  Copy,
  Check,
  Bot,
  Eye,
  EyeOff,
  Paperclip,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Mock message type
interface MockMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  model?: string;
  timestamp: Date;
}

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama3.2:latest");

  // Mock messages
  const [messages] = useState<MockMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "سلام! این یک نمونه رابط چت فارسی (RTL) است که طراحی آن دقیقاً مطابق با اپ اصلی است. رابط کاربری شامل پیام‌های بدون bubble برای دستیار و پیام‌های آبی برای کاربر می‌باشد.",
      reasoning:
        "کاربر وارد صفحه چت شده و باید با یک پیام خوشامدگویی مناسب روبرو شود. این پیام باید ویژگی‌های رابط را توضیح دهد و نشان دهد که طراحی مطابق با اپ اصلی است.",
      model: "llama3.2:latest",
      timestamp: new Date(),
    },
    {
      id: "2",
      role: "user",
      content: "سلام! عالیه. امکانات رابط چیست؟",
      timestamp: new Date(),
    },
    {
      id: "3",
      role: "assistant",
      content:
        "این رابط شامل ویژگی‌های زیر است:\n\n• **پیام‌های دستیار**: بدون bubble و با قابلیت نمایش تفکرات\n• **پیام‌های کاربر**: در bubble آبی و راست‌چین\n• **انتخاب مدل**: امکان تغییر مدل AI\n• **آپلود فایل**: پیوست کردن اسناد PDF\n• **کپی متن**: با کلیک روی آیکون کپی\n• **طراحی RTL**: کاملاً مناسب برای فارسی",
      reasoning:
        "کاربر درباره امکانات رابط سوال کرده است. باید لیست کاملی از ویژگی‌های موجود در رابط چت ارائه دهم تا کاربر با عملکردهای مختلف آشنا شود.",
      model: "llama3.2:latest",
      timestamp: new Date(),
    },
  ]);

  // Mock models list
  const mockModels = [
    { name: "llama3.2:latest" },
    { name: "gemma2:latest" },
    { name: "qwen2.5:latest" },
  ];

  const handleSendMessage = useCallback(() => {
    if (!prompt.trim()) return;
    setIsStreaming(true);
    // Simulate API call
    setTimeout(() => {
      setIsStreaming(false);
      setPrompt("");
    }, 2000);
  }, [prompt]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (isStreaming) {
          setIsStreaming(false);
        } else {
          handleSendMessage();
        }
      }
    },
    [isStreaming, handleSendMessage],
  );

  const renderMessages = useMemo(() => {
    if (messages.length > 0) {
      return (
        <div className="space-y-8">
          {messages.map((message) => (
            <MessageComponent key={message.id} message={message} />
          ))}
        </div>
      );
    }

    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="bg-muted mx-auto mb-4 h-16 w-16 rounded-full p-4">
            <BotIcon className="text-muted-foreground h-full w-full" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-semibold">
            {PERSIAN_TEXTS.chat.askQuestion}
          </h3>
          <p className="text-muted-foreground text-sm">
            {PERSIAN_TEXTS.chat.askQuestionDescription}
          </p>
        </div>
      </div>
    );
  }, [messages]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar side="right" />
      <SidebarInset>
        <Header SideBarTrigger={<SidebarTrigger />} />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex h-full flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="mx-auto max-w-4xl px-6 py-8 pb-32">
                  {renderMessages}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Input Area */}
            <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-50 border-t backdrop-blur">
              <div className="mx-auto max-w-4xl">
                <ChatInputComponent
                  prompt={prompt}
                  setPrompt={setPrompt}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  handleSendMessage={handleSendMessage}
                  handleKeyDown={handleKeyDown}
                  isStreaming={isStreaming}
                  setIsStreaming={setIsStreaming}
                  mockModels={mockModels}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Message Component matching parent app exactly
function MessageComponent({ message }: { message: MockMessage }) {
  if (message.role === "user") {
    return <UserMessageComponent message={message} />;
  }
  return <AssistantMessageComponent message={message} />;
}

function AssistantMessageComponent({ message }: { message: MockMessage }) {
  const [collapsed, setCollapsed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  }, []);

  const hasThinking = Boolean(message.reasoning);
  const formattedTime = message.timestamp.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group w-full">
      {/* Thinking section */}
      {hasThinking && (
        <div className="bg-muted/50 mb-6 rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></div>
              <span className="text-muted-foreground text-sm font-medium">
                تفکر
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <Eye className="mr-1 h-3 w-3" />
              ) : (
                <EyeOff className="mr-1 h-3 w-3" />
              )}
              {collapsed
                ? PERSIAN_TEXTS.chat.showThoughts
                : PERSIAN_TEXTS.chat.hideThoughts}
            </Button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed ? "max-h-0 opacity-0" : "max-h-[400px] opacity-100"
            }`}
          >
            <div
              dir="ltr"
              className="text-muted-foreground text-justify text-sm"
            >
              {message.reasoning}
            </div>
          </div>
        </div>
      )}

      {/* Main message content (flowing without bubble) */}
      <div className="w-full">
        <div dir="rtl" className="w-full">
          <div className="text-foreground text-justify leading-relaxed">
            {message.content}
          </div>

          {/* Message timestamp */}
          <div className="mt-4">
            <time className="text-muted-foreground/70 text-xs">
              {formattedTime}
            </time>
          </div>
        </div>

        {/* Actions below the message content */}
        <TooltipProvider>
          <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-md p-0"
                  onClick={() => handleCopy(message.content)}
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-md p-0"
                >
                  <Bot className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{message.model ?? "Unknown Model"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}

function UserMessageComponent({ message }: { message: MockMessage }) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  }, []);

  const formattedTime = message.timestamp.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group flex w-full justify-end">
      <div className="max-w-[85%]">
        <div
          className="rounded-sm bg-blue-600 px-3 py-2 text-sm leading-relaxed text-white"
          dir="rtl"
        >
          {message.content}
        </div>

        {/* Message timestamp */}
        <div className="mt-2">
          <time className="text-xs text-black dark:text-white">
            {formattedTime}
          </time>
        </div>

        {/* Actions below message bubble */}
        <TooltipProvider>
          <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-md p-0"
                  onClick={() => handleCopy(message.content)}
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
      </div>
    </div>
  );
}

// Chat Input Component matching parent app
function ChatInputComponent({
  prompt,
  setPrompt,
  selectedModel,
  setSelectedModel,
  handleSendMessage,
  handleKeyDown,
  isStreaming,
  setIsStreaming,
  mockModels,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  handleSendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isStreaming: boolean;
  setIsStreaming: (value: boolean) => void;
  mockModels: { name: string }[];
}) {
  const textDirection = useMemo(() => (prompt ? "rtl" : "rtl"), [prompt]);

  const handleSendButtonClick = useCallback(() => {
    if (isStreaming) {
      setIsStreaming(false);
    } else {
      handleSendMessage();
    }
  }, [isStreaming, setIsStreaming, handleSendMessage]);

  return (
    <div className="space-y-4 px-6 py-4">
      {/* Message Input Area */}
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={PERSIAN_TEXTS.chat.writeMessage}
          className="min-h-[60px] w-full resize-none border-0 bg-transparent px-4 py-3 pr-12 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          dir={textDirection}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between">
        {/* Left side - Model selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px] border-0 bg-transparent text-sm shadow-none focus:ring-0">
              <SelectValue
                placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
              />
            </SelectTrigger>
            <SelectContent>
              {mockModels.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right side - Send button */}
        <div className="flex items-center gap-2">
          {/* Mock PDF Attachment */}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={isStreaming}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant={isStreaming ? "destructive" : "ghost"}
            disabled={!isStreaming && !prompt.trim()}
            onClick={handleSendButtonClick}
            className="size-8"
          >
            {isStreaming ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
