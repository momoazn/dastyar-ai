"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { MessageSquare, ImageIcon, MessageCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              {PERSIAN_TEXTS.index.appTitle}
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              {PERSIAN_TEXTS.index.description}
            </p>
          </div>

          <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="size-5" />
                  {PERSIAN_TEXTS.index.chatTitle}
                </CardTitle>
                <CardDescription>
                  {PERSIAN_TEXTS.index.chatDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/chat">{PERSIAN_TEXTS.index.start}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="size-5" />
                  {PERSIAN_TEXTS.index.translationTitle}
                </CardTitle>
                <CardDescription>
                  {PERSIAN_TEXTS.index.translationDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/translation">{PERSIAN_TEXTS.index.start}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="size-5" />
                  {PERSIAN_TEXTS.index.imageTitle}
                </CardTitle>
                <CardDescription>
                  {PERSIAN_TEXTS.index.imageDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/image">{PERSIAN_TEXTS.index.start}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
