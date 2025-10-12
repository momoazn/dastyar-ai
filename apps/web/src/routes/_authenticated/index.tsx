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
import { fa } from "@/lib/persian-texts";

export const Route = createFileRoute("/_authenticated/")({
  component: HomeComponent,
});

const features = [
  {
    icon: <MessageSquare className="h-12 w-12" />,
    title: fa.index.chatTitle,
    description: fa.index.chatDescription,
    link: "/chat",
    color: "text-primary",
  },
  {
    icon: <MessageCircle className="h-12 w-12" />,
    title: fa.index.translationTitle,
    description: fa.index.translationDescription,
    link: "/translation",
    color: "text-primary",
  },
  {
    icon: <FileText className="h-12 w-12" />,
    title: fa.summarize.title,
    description: fa.summarize.description,
    link: "/summarize",
    color: "text-blue-600",
  },
  {
    icon: <Mic className="h-12 w-12" />,
    title: fa.transcribe.title,
    description: fa.transcribe.description,
    link: "/transcribe",
    color: "text-green-600",
  },
  {
    icon: <Image className="h-12 w-12" />,
    title: fa.index.imageTitle,
    description: fa.index.imageDescription,
    link: "/image",
    color: "text-accent-foreground",
  },
  {
    icon: <Code className="h-12 w-12" />,
    title: fa.index.codeTitle,
    description: fa.index.codeDescription,
    link: "/code",
    color: "text-purple-600",
  },
] as const;

function HomeComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex flex-col items-center justify-center p-4 pt-16 md:p-8 md:pt-24">
        <section className="w-full max-w-6xl space-y-12">
          {/* Hero Section */}
          <header className="space-y-8 text-center">
            <div className="space-y-6">
              <div className="relative">
                <h1 className="fade-in slide-in-from-top-4 animate-in bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text font-bold text-5xl text-transparent duration-1000 md:text-6xl lg:text-7xl">
                  {fa.index.appTitle}
                </h1>
                {/* Decorative elements */}
                <div className="-top-4 -right-4 absolute h-8 w-8 animate-pulse rounded-full bg-primary/20" />
                <div className="-bottom-2 -left-4 absolute h-6 w-6 animate-pulse rounded-full bg-primary/15 delay-500" />
              </div>
              <p className="fade-in slide-in-from-bottom-4 mx-auto max-w-2xl animate-in text-muted-foreground text-xl delay-300 duration-1000 md:text-2xl">
                {fa.index.description}
              </p>
            </div>
          </header>

          {/* Features Grid */}
          <main className="space-y-8">
            <div className="text-center">
              <h2 className="font-bold text-3xl">{fa.index.smartToolsTitle}</h2>
              <p className="mt-2 text-muted-foreground">
                {fa.index.smartToolsSubtitle}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card
                  className="group fade-in slide-in-from-bottom-4 relative animate-in overflow-hidden border-2 bg-card/80 p-6 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/20"
                  key={feature.link}
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animationFillMode: "both",
                  }}
                >
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100" />

                  {/* Floating particles effect */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="absolute top-2 right-2 h-1 w-1 animate-pulse rounded-full bg-primary/30" />
                    <div className="absolute bottom-4 left-3 h-1 w-1 animate-pulse rounded-full bg-primary/20 delay-300" />
                    <div className="absolute top-1/2 right-4 h-1 w-1 animate-pulse rounded-full bg-primary/25 delay-700" />
                  </div>

                  <div className="relative z-10">
                    <div
                      className={`${feature.color} mb-4 transition-all duration-500 group-hover:rotate-3 group-hover:scale-110`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="mb-3 font-semibold text-xl transition-colors duration-300 group-hover:text-primary">
                      {feature.title}
                    </h3>
                    <p className="mb-6 min-h-[3rem] text-muted-foreground text-sm leading-relaxed transition-colors duration-300 group-hover:text-foreground/80">
                      {feature.description}
                    </p>
                    <Button
                      asChild
                      className="w-full transition-all duration-300 group-hover:bg-primary/90 group-hover:shadow-lg group-hover:shadow-primary/25"
                      size="lg"
                    >
                      <Link to={feature.link}>{fa.index.start}</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </main>

          {/* Call to Action */}
          <div className="fade-in slide-in-from-bottom-4 relative animate-in overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-8 text-center delay-700 duration-1000">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
            <div className="absolute top-0 left-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-0 bottom-0 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />

            <div className="relative z-10">
              <h3 className="mb-4 font-bold text-2xl">
                {fa.index.readyToStartTitle}
              </h3>
              <p className="mb-6 text-muted-foreground">
                {fa.index.readyToStartDescription}
              </p>
              <Button
                asChild
                className="px-8 transition-all duration-300 hover:scale-105 hover:shadow-primary/25 hover:shadow-xl"
                size="lg"
              >
                <Link to="/chat">{fa.index.startChat}</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
