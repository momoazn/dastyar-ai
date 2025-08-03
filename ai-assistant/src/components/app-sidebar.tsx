"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Plus, MessageSquare, Image, TrashIcon, Languages, ArchiveIcon } from "lucide-react";
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

// Remove the custom SidebarItem - we'll use shadcn components directly

function ChatSidebar() {
  const mockThreads: Thread[] = [
    { id: "1", title: "پرسش درباره پروژه", created: new Date(Date.now() - 5 * 60 * 1000) },
    { id: "2", title: "ایده‌های محصول", created: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: "3", title: "رفع اشکال", created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { id: "4", title: "پژوهش کوتاه", created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  ];

  const handleNewThread = () => console.log("Creating new thread");
  const handleDeleteThread = (threadId: string) => console.log("Deleting thread:", threadId);
  const handleArchiveThread = (threadId: string) => console.log("Archiving thread:", threadId);

  return (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={handleNewThread}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare className="size-4" />
              </div>
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-semibold">{PERSIAN_TEXTS.navigation.chat}</span>
                <span className="truncate text-xs">گفتگو با هوش مصنوعی</span>
              </div>
              <Plus className="size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>رشته‌های گفتگو</SidebarGroupLabel>
          <SidebarMenu>
            {mockThreads.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  {PERSIAN_TEXTS.navigation.noChatThreads}
                </p>
              </div>
            ) : (
              mockThreads.map((thread, index) => (
                <SidebarMenuItem key={thread.id} className="group/item relative">
                  <SidebarMenuButton asChild isActive={index === 0} className="h-12">
                    <a href="#" title={thread.title}>
                      <MessageSquare className="size-4" />
                      <span className="truncate">{thread.title}</span>
                    </a>
                  </SidebarMenuButton>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleArchiveThread(thread.id);
                      }}
                    >
                      <ArchiveIcon className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteThread(thread.id);
                      }}
                    >
                      <TrashIcon className="size-3" />
                    </Button>
                  </div>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={handleNewTranslation}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Languages className="size-4" />
              </div>
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-semibold">{PERSIAN_TEXTS.navigation.translation}</span>
                <span className="truncate text-xs">ترجمه متن</span>
              </div>
              <Plus className="size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>تاریخچه ترجمه</SidebarGroupLabel>
          <SidebarMenu>
            {mockTranslations.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  {PERSIAN_TEXTS.translation.noTranslations}
                </p>
              </div>
            ) : (
              mockTranslations.map((translation, index) => (
                <SidebarMenuItem key={translation.id} className="group/item relative">
                  <SidebarMenuButton asChild isActive={index === 0} className="h-14">
                    <a href="#" title={translation.sourceText}>
                      <Languages className="size-4" />
                      <div className="grid flex-1 text-right text-sm leading-tight">
                        <span className="truncate font-medium">
                          {translation.sourceText.slice(0, 30) + (translation.sourceText.length > 30 ? "..." : "")}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {translation.sourceLanguage} → {translation.targetLanguage}
                        </span>
                      </div>
                    </a>
                  </SidebarMenuButton>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteTranslation(translation.id);
                      }}
                    >
                      <TrashIcon className="size-3" />
                    </Button>
                  </div>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={handleNewImage}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Image className="size-4" />
              </div>
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-semibold">{PERSIAN_TEXTS.navigation.imageGeneration}</span>
                <span className="truncate text-xs">تولید تصویر</span>
              </div>
              <Plus className="size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>تصاویر تولید شده</SidebarGroupLabel>
          <SidebarMenu>
            {mockImages.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  هیچ تصویری تولید نشده است
                </p>
              </div>
            ) : (
              mockImages.map((image, index) => (
                <SidebarMenuItem key={image.id} className="group/item relative">
                  <SidebarMenuButton asChild isActive={index === 0} className="h-12">
                    <a href="#" title={image.prompt}>
                      <Image className="size-4" />
                      <span className="truncate">
                        {image.prompt.slice(0, 35) + (image.prompt.length > 35 ? "..." : "")}
                      </span>
                    </a>
                  </SidebarMenuButton>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                    >
                      <TrashIcon className="size-3" />
                    </Button>
                  </div>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
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
