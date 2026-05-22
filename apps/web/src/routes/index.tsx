import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Code,
  FileText,
  Image,
  MessageCircle,
  MessageSquare,
  Mic,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { fa } from "@/lib/texts";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const features = [
  {
    icon: <MessageSquare className="size-12" />,
    title: fa.index.chatTitle,
    description: fa.index.chatDescription,
    link: "/chat",
    color: "text-primary",
  },
  {
    icon: <Image className="size-12" />,
    title: fa.index.imageTitle,
    description: fa.index.imageDescription,
    link: "/image",
    color: "text-primary",
  },
  {
    icon: <Code className="size-12" />,
    title: fa.index.codeTitle,
    description: fa.index.codeDescription,
    link: "/code",
    color: "text-primary",
  },
  {
    icon: <MessageCircle className="size-12" />,
    title: fa.index.translationTitle,
    description: fa.index.translationDescription,
    link: "/translation",
    color: "text-primary",
  },
  {
    icon: <FileText className="size-12" />,
    title: fa.summarize.title,
    description: fa.summarize.description,
    link: "/summary",
    color: "text-primary",
  },
  {
    icon: <Mic className="size-12" />,
    title: fa.transcribe.title,
    description: fa.transcribe.description,
    link: "/transcribe",
    color: "text-primary",
  },
] as const;

function HomeComponent() {
  return (
    <main className="min-h-0 flex-1 overflow-auto bg-linear-to-b from-background to-muted/20">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
        <header className="text-right">
          <div className="space-y-3">
            <p className="font-medium text-primary text-sm">
              {fa.index.smartToolsTitle}
            </p>
            <h1 className="max-w-3xl text-balance font-bold text-3xl leading-tight md:text-5xl">
              {fa.index.appTitle}
            </h1>
            <p className="max-w-2xl text-muted-foreground leading-7">
              {fa.index.description}
            </p>
            <div className="pt-2">
              <Button asChild className="w-full sm:w-auto" size="lg">
                <Link to="/chat">{fa.index.start}</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <Card
              className="group hover:-translate-y-0.5 flex min-h-48 flex-col justify-between border bg-card p-5 shadow-none transition-[border-color,transform,box-shadow] duration-200 hover:border-primary/35 hover:shadow-md"
              key={feature.link}
            >
              <div className="space-y-4">
                <div
                  className={`${feature.color} flex size-12 items-center justify-center rounded-md bg-muted`}
                >
                  {feature.icon}
                </div>
                <div className="space-y-2">
                  <h2 className="font-semibold text-lg">{feature.title}</h2>
                  <p className="text-muted-foreground text-sm leading-7">
                    {feature.description}
                  </p>
                </div>
              </div>
              <Button asChild className="mt-5 w-full">
                <Link to={feature.link}>{fa.index.start}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
