"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Plus, MessageSquare, Image, TrashIcon, Languages } from "lucide-react";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { Badge } from "./ui/badge";

interface Thread {
  id: string;
  title: string;
  created: Date;
}

interface Translation {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  created: Date;
}

interface ImageGeneration {
  id: string;
  prompt: string;
  imageUrl?: string;
  created: Date;
}

interface SidebarItemProps {
  title: string;
  subtitle?: string;
  isActive?: boolean;
  onArchive?: () => void;
  onDelete?: () => void;
  icon?: React.ReactNode;
  timestamp?: Date;
  badge?: string;
}

function SidebarItem({
  title,
  subtitle,
  isActive,
  onArchive,
  onDelete,
  icon,
  timestamp,
  badge,
}: SidebarItemProps) {
  return (
    <div
      className={`group/item relative flex h-auto min-h-12 cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent ${
        isActive ? "bg-accent/50" : ""
      }`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute right-0 top-0 h-full w-1 bg-primary" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium text-foreground">
          {title ?? "Untitled"}
        </div>
        {subtitle && (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>

      {/* Badge */}
      {badge && isActive && (
        <Badge variant="secondary" className="text-xs h-5 px-2">
          {badge}
        </Badge>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
          >
            <TrashIcon className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ChatSidebar() {
  const mockThreads: Thread[] = [
    { id: "1", title: "پرسش درباره پروژه", created: new Date(Date.now() - 5 * 60 * 1000) },
    { id: "2", title: "ایده‌های محصول", created: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: "3", title: "رفع اشکال", created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { id: "4", title: "پژوهش کوتاه", created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  ];

  const handleNewThread = () => console.log("Creating new thread");
  const handleArchiveThread = (threadId: string) => console.log("Archiving thread:", threadId);
  const handleDeleteThread = (threadId: string) => console.log("Deleting thread:", threadId);

  return (
    <>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            <span className="font-semibold">{PERSIAN_TEXTS.navigation.chat}</span>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={handleNewThread}>
            <Plus className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {mockThreads.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  {PERSIAN_TEXTS.navigation.noChatThreads}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {mockThreads.map((thread, index) => (
                  <SidebarItem
                    key={thread.id}
                    title={thread.title}
                    isActive={index === 0}
                    badge={index === 0 ? "فعال" : undefined}
                    onDelete={() => handleDeleteThread(thread.id)}
                  />
                ))}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}

function TranslationSidebar() {
  const mockTranslations: Translation[] = [
    {
      id: "1",
      sourceText: "Hello, how are you?",
      targetText: "سلام، حال شما چطور است؟",
      sourceLanguage: "انگلیسی",
      targetLanguage: "فارسی",
      created: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: "2",
      sourceText: "Good morning",
      targetText: "صبح بخیر",
      sourceLanguage: "انگلیسی",
      targetLanguage: "فارسی",
      created: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      id: "3",
      sourceText: "درود بر شما",
      targetText: "Greetings to you",
      sourceLanguage: "فارسی",
      targetLanguage: "انگلیسی",
      created: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ];

  const handleNewTranslation = () => console.log("Creating new translation");
  const handleDeleteTranslation = (translationId: string) => console.log("Deleting translation:", translationId);

  return (
    <>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="size-5 text-primary" />
            <span className="font-semibold">{PERSIAN_TEXTS.navigation.translation}</span>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={handleNewTranslation}>
            <Plus className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {mockTranslations.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  {PERSIAN_TEXTS.translation.noTranslations}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {mockTranslations.map((translation, index) => (
                  <SidebarItem
                    key={translation.id}
                    title={translation.sourceText.slice(0, 35) + (translation.sourceText.length > 35 ? "..." : "")}
                    subtitle={`${translation.sourceLanguage} → ${translation.targetLanguage}`}
                    isActive={index === 0}
                    badge={index === 0 ? "اخیر" : undefined}
                    onDelete={() => handleDeleteTranslation(translation.id)}
                  />
                ))}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}

function ImageSidebar() {
  const mockImages: ImageGeneration[] = [
    {
      id: "1",
      prompt: "یک منظره زیبا از کوه‌های برفی",
      created: new Date(Date.now() - 20 * 60 * 1000),
    },
    {
      id: "2", 
      prompt: "گربه‌ای در حال بازی در باغ",
      created: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: "3",
      prompt: "شهر مدرن در شب با نور‌های رنگی",
      created: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ];

  const handleNewImage = () => console.log("Creating new image");
  const handleDeleteImage = (imageId: string) => console.log("Deleting image:", imageId);

  return (
    <>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="size-5 text-primary" />
            <span className="font-semibold">{PERSIAN_TEXTS.navigation.imageGeneration}</span>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={handleNewImage}>
            <Plus className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {mockImages.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  هیچ تصویری تولید نشده است
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {mockImages.map((image, index) => (
                  <SidebarItem
                    key={image.id}
                    title={image.prompt.slice(0, 40) + (image.prompt.length > 40 ? "..." : "")}
                    isActive={index === 0}
                    badge={index === 0 ? "جدید" : undefined}
                    onDelete={() => handleDeleteImage(image.id)}
                  />
                ))}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  
  const getSidebarContent = () => {
    if (pathname.startsWith("/chat")) {
      return <ChatSidebar />;
    }
    if (pathname.startsWith("/translation")) {
      return <TranslationSidebar />;
    }
    if (pathname.startsWith("/image")) {
      return <ImageSidebar />;
    }
    // Default to chat sidebar
    return <ChatSidebar />;
  };

  return (
    <Sidebar {...props}>
      {getSidebarContent()}
    </Sidebar>
  );
}
