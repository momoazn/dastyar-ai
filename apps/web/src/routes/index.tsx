import { Image, Languages, MessageSquare } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

import { Button, Card } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const features = [
  {
    icon: <MessageSquare className="h-12 w-12" />,
    title: PERSIAN_TEXTS.index.chatTitle,
    description: PERSIAN_TEXTS.index.chatDescription,
    link: "/chat",
    color: "text-blue-500",
  },
  {
    icon: <Image className="h-12 w-12" />,
    title: PERSIAN_TEXTS.index.imageTitle,
    description: PERSIAN_TEXTS.index.imageDescription,
    link: "/image",
    color: "text-purple-500",
  },
  {
    icon: <Languages className="h-12 w-12" />,
    title: PERSIAN_TEXTS.index.translationTitle,
    description: PERSIAN_TEXTS.index.translationDescription,
    link: "/translation",
    color: "text-green-500",
  },
];

function HomeComponent() {
  return (
    <div className="mt-8 flex flex-col items-center justify-center p-4 md:mt-24 md:p-8">
      <section className="w-full max-w-4xl space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold">{PERSIAN_TEXTS.index.appTitle}</h1>
          <p className="text-muted-foreground text-lg">
            {PERSIAN_TEXTS.index.description}
          </p>
        </header>

        <main className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 transition-all hover:scale-105">
              <div className={feature.color}>{feature.icon}</div>
              <h2 className="mt-4 text-xl font-semibold">{feature.title}</h2>
              <p className="text-muted-foreground mt-4 h-10 text-sm">
                {feature.description}
              </p>
              <Button asChild className="mt-4 w-full">
                <Link to={feature.link}>{PERSIAN_TEXTS.index.start}</Link>
              </Button>
            </Card>
          ))}
        </main>
      </section>
    </div>
  );
}
