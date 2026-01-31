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
    color: "text-accent-foreground",
  },
  {
    icon: <Code className="size-12" />,
    title: fa.index.codeTitle,
    description: fa.index.codeDescription,
    link: "/code",
    color: "text-purple-600",
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
    link: "/summarize",
    color: "text-blue-600",
  },
  {
    icon: <Mic className="size-12" />,
    title: fa.transcribe.title,
    description: fa.transcribe.description,
    link: "/transcribe",
    color: "text-green-600",
  },
] as const;

function HomeComponent() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-linear-to-br from-background via-background to-muted/20 overflow-hidden">
      <div className="flex flex-col items-center justify-center px-4 md:px-8 w-full max-w-6xl">
        <section className="w-full space-y-6">
          {/* Hero Section */}
          <header className="space-y-4 text-center">
            <div className="relative">
              <h1 className="fade-in slide-in-from-top-4 animate-in bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text font-bold text-4xl text-transparent duration-1000 md:text-5xl lg:text-6xl">
                {fa.index.appTitle}
              </h1>
              {/* Decorative elements */}
              <div className="-top-3 -right-3 absolute h-6 w-6 animate-pulse rounded-full bg-primary/20" />
              <div className="-bottom-2 -left-3 absolute h-5 w-5 animate-pulse rounded-full bg-primary/15 delay-500" />
            </div>
            <p className="fade-in slide-in-from-bottom-4 mx-auto max-w-xl animate-in text-muted-foreground text-lg delay-300 duration-1000">
              {fa.index.description}
            </p>
          </header>

          {/* Features Grid */}
          <main className="space-y-4">
            <div className="text-center">
              <h2 className="font-bold text-2xl">{fa.index.smartToolsTitle}</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card
                  className="group fade-in slide-in-from-bottom-4 relative animate-in overflow-hidden border bg-card/80 p-4 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/20"
                  key={feature.link}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <div className="relative z-10">
                    <div className={`${feature.color} mb-3 transition-all duration-500 group-hover:scale-110`}>
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 font-semibold text-lg transition-colors duration-300 group-hover:text-primary">
                      {feature.title}
                    </h3>
                    <p className="mb-4 min-h-[2.5rem] text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                    <Button
                      asChild
                      className="w-full transition-all duration-300"
                      size="default"
                    >
                      <Link to={feature.link}>{fa.index.start}</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}
