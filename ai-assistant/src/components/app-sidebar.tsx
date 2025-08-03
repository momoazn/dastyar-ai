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
import { Plus, MessageSquare, MessageCircle, Image, ArchiveIcon, TrashIcon } from "lucide-react";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";

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
}

function SidebarItem({
  title,
  subtitle,
  isActive,
  onArchive,
  onDelete,
}: SidebarItemProps) {
  return (
    <div
      className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative flex h-auto min-h-12 items-center justify-between border-b p-4 text-sm ${isActive ? "bg-sidebar-accent" : ""}`}
    >
      {isActive && (
        <div className="absolute top-0 right-0 h-full w-1 bg-blue-500" />
      )}

      <div className="flex-1 truncate">
        <div className="truncate font-medium">{title ?? "Untitled"}</div>
        {subtitle && (
          <div className="text-muted-foreground mt-1 truncate text-xs">{subtitle}</div>
        )}
      </div>

      <div className="flex items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100">
        {onArchive && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-pointer hover:text-blue-500"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onArchive();
            }}
          >
            <ArchiveIcon className="size-3" />
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-pointer hover:text-red-500"
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
    { id: "1", title: "پرسش درباره پروژه", created: new Date() },
    { id: "2", title: "ایده‌های محصول", created: new Date() },
    { id: "3", title: "رفع اشکال", created: new Date() },
    { id: "4", title: "پژوهش کوتاه", created: new Date() },
  ];

  const handleNewThread = () => console.log("Creating new thread");
  const handleArchiveThread = (threadId: string) => console.log("Archiving thread:", threadId);
  const handleDeleteThread = (threadId: string) => console.log("Deleting thread:", threadId);

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-sidebar-primary size-5" />
            <span className="font-semibold">{PERSIAN_TEXTS.navigation.chat}</span>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={handleNewThread}>
            <Plus className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>رشته‌های گفتگو</SidebarGroupLabel>
          <SidebarGroupContent className="px-0">
            {mockThreads.length === 0 ? (
              <div className="mt-4 flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  {PERSIAN_TEXTS.navigation.noChatThreads}
                </p>
              </div>
            ) : (
              <div className="group">
                {mockThreads.map((thread, index) => (
                  <SidebarItem
                    key={thread.id}
                    title={thread.title}
                    isActive={index === 0}
                    onArchive={() => handleArchiveThread(thread.id)}
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
      created: new Date(),
    },
    {
      id: "2",
      sourceText: "Good morning",
      targetText: "صبح بخیر",
      sourceLanguage: "انگلیسی",
      targetLanguage: "فارسی",
      created: new Date(),
    },
    {
      id: "3",
      sourceText: "درود بر شما",
      targetText: "Greetings to you",
      sourceLanguage: "فارسی",
      targetLanguage: "انگلیسی",
      created: new Date(),
    },
  ];

  const handleNewTranslation = () => console.log("Creating new translation");
  const handleDeleteTranslation = (translationId: string) => console.log("Deleting translation:", translationId);

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-sidebar-primary size-5" />
            <span className="font-semibold">{PERSIAN_TEXTS.navigation.translation}</span>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={handleNewTranslation}>
            <Plus className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>تاریخچه ترجمه</SidebarGroupLabel>
          <SidebarGroupContent className="px-0">
            {mockTranslations.length === 0 ? (
              <div className="mt-4 flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  {PERSIAN_TEXTS.translation.noTranslations}
                </p>
              </div>
            ) : (
              <div className="group">
                {mockTranslations.map((translation, index) => (
                  <SidebarItem
                    key={translation.id}
                    title={translation.sourceText.slice(0, 30) + (translation.sourceText.length > 30 ? "..." : "")}
                    subtitle={`${translation.sourceLanguage} → ${translation.targetLanguage}`}
                    isActive={index === 0}
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
      created: new Date(),
    },
    {
      id: "2", 
      prompt: "گربه‌ای در حال بازی در باغ",
      created: new Date(),
    },
    {
      id: "3",
      prompt: "شهر مدرن در شب با نور‌های رنگی",
      created: new Date(),
    },
  ];

  const handleNewImage = () => console.log("Creating new image");
  const handleDeleteImage = (imageId: string) => console.log("Deleting image:", imageId);

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="flex items-center gap-2">
            <Image className="text-sidebar-primary size-5" />
            <span className="font-semibold">{PERSIAN_TEXTS.navigation.imageGeneration}</span>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={handleNewImage}>
            <Plus className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>تصاویر تولید شده</SidebarGroupLabel>
          <SidebarGroupContent className="px-0">
            {mockImages.length === 0 ? (
              <div className="mt-4 flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  هیچ تصویری تولید نشده است
                </p>
              </div>
            ) : (
              <div className="group">
                {mockImages.map((image, index) => (
                  <SidebarItem
                    key={image.id}
                    title={image.prompt.slice(0, 40) + (image.prompt.length > 40 ? "..." : "")}
                    isActive={index === 0}
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
