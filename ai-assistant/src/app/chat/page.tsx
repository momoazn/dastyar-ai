"use client";

import React from "react";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// RTL Persian chatbot mock UI with right sidebar for threads, no functionality.
// Full-width layout using shadcn/ui components.

export default function Page() {
  return (
    <div dir="rtl" className="h-dvh w-full">
      <SidebarProvider defaultOpen={true} className="bg-background">
        {/* Sidebar anchored to the right */}
        <Sidebar side="right" variant="sidebar" collapsible="offcanvas" className="border-l">
          <SidebarHeader>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6M12 3v4m-7 3a7 7 0 1014 0 7 7 0 00-14 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold">دستیار هوشمند</div>
                  <div className="text-xs text-muted-foreground">رشته‌های گفتگو</div>
                </div>
              </div>
              {/* Rail for hover toggle on desktop */}
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>رشته‌ها</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="justify-start" isActive>
                    <span className="text-sm font-medium">پرسش درباره پروژه</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="justify-start">
                    <span className="text-sm">ایده‌های محصول</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="justify-start">
                    <span className="text-sm">رفع اشکال</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="justify-start">
                    <span className="text-sm">پژوهش کوتاه</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarSeparator />

          <SidebarFooter>
            <Button variant="outline" className="w-full text-xs">رشته جدید</Button>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        {/* Main content area fills remaining width */}
        <SidebarInset>
          <div className="flex h-full flex-col">
            {/* Top bar */}
            <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6M12 3v4m-7 3a7 7 0 1014 0 7 7 0 00-14 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-sm font-bold md:text-base">گفتگو نمونه</h1>
                  <p className="text-xs text-muted-foreground">بدون عملکرد و ذخیره‌سازی</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  خانه
                </Link>
              </div>
            </header>

            {/* Messages list */}
            <ScrollArea className="flex-1">
              <div className="mx-auto w-full max-w-3xl px-4 py-4">
                <div className="flex flex-col gap-4">
                  <AssistantMessage>
                    سلام! این یک نمونه رابط چت فارسی (RTL) است. در حال حاضر عملکرد
                    واقعی ارسال یا ذخیره‌سازی ندارد.
                  </AssistantMessage>

                  <UserMessage>سلام! خیلی خوبه. امکانات رابط چیست؟</UserMessage>

                  <AssistantMessage>
                    شما می‌توانید پیام‌های نمونه را ببینید و در پایین متن تایپ کنید.
                    اما دکمه ارسال غیرفعال است و هیچ ذخیره‌سازی انجام نمی‌شود.
                  </AssistantMessage>
                </div>
              </div>
            </ScrollArea>

            <Separator />

            {/* Input area (static) */}
            <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-3">
              <div className="flex items-end gap-2">
                <Button variant="outline" size="sm" className="hidden md:inline-flex">
                  پیوست
                </Button>
                <Textarea
                  dir="rtl"
                  placeholder="پیام خود را بنویسید..."
                  className="min-h-10 flex-1 resize-none"
                  rows={1}
                />
                <Button size="sm" disabled title="ارسال (غیرفعال)">
                  ارسال
                </Button>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                توجه: این رابط فقط نمایشی است و ارسال/ذخیره‌سازی فعال نیست.
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

/* Message components using shadcn/ui Avatar */

function AssistantMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar>
        <AvatarFallback>هو</AvatarFallback>
      </Avatar>
      <div className="flex max-w-[85%] flex-col">
        <div className="rounded-2xl rounded-tr-sm border bg-muted/40 px-3 py-2 text-sm leading-6">
          {children}
        </div>
        <span className="mt-1 text-[10px] text-muted-foreground">دستیار • الان</span>
      </div>
    </div>
  );
}

function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="flex max-w-[85%] flex-col items-end">
        <div className="rounded-2xl rounded-tl-sm bg-primary px-3 py-2 text-sm leading-6 text-primary-foreground shadow">
          {children}
        </div>
        <span className="mt-1 text-[10px] text-muted-foreground">شما • چند لحظه پیش</span>
      </div>
      <Avatar>
        <AvatarFallback>شم</AvatarFallback>
      </Avatar>
    </div>
  );
}