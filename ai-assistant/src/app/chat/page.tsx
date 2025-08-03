"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
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
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Mock message type
interface MockMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  model?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama3.2:latest");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );

  // Mock messages with enhanced content
  const [messages, setMessages] = useState<MockMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "سلام و درود! 👋\n\nبه **دستیار هوشمند فارسی** خوش آمدید. این رابط چت پیشرفته با ویژگی‌های زیر طراحی شده:\n\n✨ **طراحی مدرن**: رابط کاربری زیبا و کاربردی\n🎨 **تم تاریک/روشن**: پشتیبانی کامل از حالت‌های مختلف نمایش\n🧠 **نمایش تفکرات**: قابلیت مشاهده فرآیند تفکر هوش مصنوعی\n📱 **طراحی ریسپانسیو**: سازگار با تمام دستگاه‌ها\n\nچه کاری می‌توانم برایتان انجام دهم؟",
      reasoning:
        "کاربر وارد صفحه چت شده و نیاز به یک پیام خوشامدگویی جامع و دوستانه دارد. باید ویژگی‌های اصلی رابط را معرفی کنم و احساس راحتی و اعتماد ایجاد کنم.",
      model: "llama3.2:latest",
      timestamp: new Date(Date.now() - 5 * 60000),
    },
    {
      id: "2",
      role: "user",
      content:
        "سلام! رابط خیلی زیبا و کاربردی شده. امکانات جدید چه چیزهایی هستند؟",
      timestamp: new Date(Date.now() - 3 * 60000),
    },
    {
      id: "3",
      role: "assistant",
      content:
        "ممنون از بازخورد مثبت شما! 😊 رابط جدید شامل بهبودهای مهمی شده:\n\n## 🎨 **بهبودهای بصری**\n- رنگ‌بندی هوشمند با تم‌های روشن/تاریک\n- انیمیشن‌های روان و طبیعی\n- Typography بهتر با فونت Vazirmatn\n\n## ⚡ **عملکرد بهتر**\n- پاسخ‌دهی سریع‌تر\n- Streaming متن در زمان واقعی\n- مدیریت بهتر حالت‌های Loading\n\n## 🛠️ **ابزارهای جدید**\n- کپی متن با یک کلیک\n- نمایش اطلاعات مدل AI\n- پیوست فایل‌های PDF\n- Regenerate پیام‌ها\n\nآیا می‌خواهید یکی از این ویژگی‌ها را امتحان کنید؟",
      reasoning:
        "کاربر از بهبودهای رابط تشکر کرده و درباره امکانات جدید سوال پرسیده. باید لیست جامع و سازمان‌یافته‌ای از ویژگی‌های جدید ارائه دهم تا کاربر بتواند آنها را بهتر درک کند.",
      model: "llama3.2:latest",
      timestamp: new Date(Date.now() - 1 * 60000),
    },
  ]);

  // Mock models list with more details
  const mockModels = [
    { name: "llama3.2:latest", displayName: "Llama 3.2 (Latest)" },
    { name: "gemma2:latest", displayName: "Gemma 2 (Google)" },
    { name: "qwen2.5:latest", displayName: "Qwen 2.5 (Alibaba)" },
    { name: "mixtral:8x7b", displayName: "Mixtral 8x7B" },
  ];

  const handleSendMessage = useCallback(() => {
    if (!prompt.trim()) return;
    console.log("Sending message:", prompt);
    setPrompt("");
  }, [prompt]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
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

  const handleRegenerate = useCallback(() => {
    console.log("Regenerating message:", message.id);
  }, [message.id]);

  const hasThinking = Boolean(message.reasoning);
  const formattedTime = message.timestamp.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group animate-in fade-in-50 slide-in-from-bottom-2 w-full duration-500">
      {/* Thinking section with improved styling */}
      {hasThinking && (
        <div className="mb-6 rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 p-4 shadow-sm dark:border-amber-800/30 dark:from-amber-950/20 dark:to-yellow-950/20">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></div>
              </div>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                💭 فرآیند تفکر
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <Eye className="ml-1 h-3 w-3" />
              ) : (
                <EyeOff className="ml-1 h-3 w-3" />
              )}
              {collapsed ? "نمایش" : "پنهان"}
            </Button>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              collapsed ? "max-h-0 opacity-0" : "max-h-[400px] opacity-100",
            )}
          >
            <div className="rounded-lg bg-white/50 p-3 dark:bg-black/20">
              <div
                dir="ltr"
                className="text-justify text-sm leading-relaxed text-amber-800 dark:text-amber-200"
              >
                {message.reasoning}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main message content with enhanced styling */}
      <div className="w-full">
        <div dir="rtl" className="w-full">
          <div className="prose prose-sm text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-code:text-primary prose-pre:bg-muted prose-ul:list-none prose-li:flex prose-li:items-start prose-li:gap-2 prose-li:my-1 max-w-none">
            <div className="text-justify leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => (
                    <h3 className="text-foreground mt-4 mb-2 text-lg font-semibold">
                      {children}
                    </h3>
                  ),
                  h3: ({ children }) => (
                    <h4 className="text-foreground mt-3 mb-2 text-base font-semibold">
                      {children}
                    </h4>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-primary font-semibold">
                      {children}
                    </strong>
                  ),
                  li: ({ children }) => (
                    <div className="my-1 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{children}</span>
                    </div>
                  ),
                  p: ({ children }) => <div className="mb-3">{children}</div>,
                  code: ({ children, ...props }) => {
                    const isInline = !String(props.className).includes(
                      "language-",
                    );
                    return isInline ? (
                      <code className="bg-muted text-primary rounded px-1.5 py-0.5 font-mono text-sm">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-muted overflow-x-auto rounded-lg p-3">
                        <code className="font-mono text-sm">{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Enhanced message metadata */}
          <div className="mt-4 flex items-center gap-3">
            <time className="text-muted-foreground/70 text-xs">
              {formattedTime}
            </time>
            {message.model && (
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground/70 text-xs">
                  {message.model}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced action buttons */}
        <TooltipProvider>
          <div className="mt-4 flex items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-lg p-0"
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
                  className="hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-lg p-0"
                  onClick={handleRegenerate}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{PERSIAN_TEXTS.chat.regenerate}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-lg p-0"
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
    <div className="group animate-in fade-in-50 slide-in-from-left-2 flex w-full justify-end duration-300">
      <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
        {/* Enhanced message bubble with gradient and shadows */}
        <div className="relative">
          <div
            className="bg-primary/80 dark:bg-primary/70 text-primary-foreground shadow-primary/15 hover:shadow-primary/20 relative rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl"
            dir="rtl"
          >
            {/* Subtle overlay for depth */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl rounded-br-md bg-gradient-to-br from-white/5 to-transparent" />

            {/* Message content */}
            <div className="relative z-10 break-words whitespace-pre-wrap">
              {message.content}
            </div>
          </div>

          {/* Message tail/pointer */}
          <div className="bg-primary/80 dark:bg-primary/70 absolute right-0 -bottom-0.5 h-3 w-3 rotate-45" />
        </div>

        {/* Enhanced metadata and actions */}
        <div className="mt-3 flex items-center justify-between gap-3">
          {/* Timestamp with better styling */}
          <time className="text-muted-foreground/80 text-xs font-medium">
            {formattedTime}
          </time>

          {/* Actions with improved positioning */}
          <TooltipProvider>
            <div className="translate-y-1 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-accent hover:text-accent-foreground h-7 w-7 rounded-full p-0 transition-all duration-200 hover:scale-105"
                    onClick={() => handleCopy(message.content)}
                  >
                    {copySuccess ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">
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
