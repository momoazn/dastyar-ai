import { createFileRoute, Link } from '@tanstack/react-router';
import { Image, Languages, MessageSquare } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { fa } from '@/lib/persian-texts';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

const features = [
  {
    icon: <MessageSquare className="h-12 w-12" />,
    title: fa.index.chatTitle,
    description: fa.index.chatDescription,
    link: '/chat',
    color: 'text-primary',
  },
  {
    icon: <Image className="h-12 w-12" />,
    title: fa.index.imageTitle,
    description: fa.index.imageDescription,
    link: '/image',
    color: 'text-accent-foreground',
  },
  {
    icon: <Languages className="h-12 w-12" />,
    title: fa.index.translationTitle,
    description: fa.index.translationDescription,
    link: '/translation',
    color: 'text-primary',
  },
];

function HomeComponent() {
  return (
    <div className="mt-8 flex flex-col items-center justify-center p-4 md:mt-24 md:p-8">
      <section className="w-full max-w-4xl space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="font-bold text-4xl">{fa.index.appTitle}</h1>
          <p className="text-lg text-muted-foreground">
            {fa.index.description}
          </p>
        </header>

        <main className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card
              className="p-6 transition-all hover:scale-105"
              key={feature.link}
            >
              <div className={feature.color}>{feature.icon}</div>
              <h2 className="mt-4 font-semibold text-xl">{feature.title}</h2>
              <p className="mt-4 h-10 text-muted-foreground text-sm">
                {feature.description}
              </p>
              <Button asChild className="mt-4 w-full">
                <Link to={feature.link}>{fa.index.start}</Link>
              </Button>
            </Card>
          ))}
        </main>
      </section>
    </div>
  );
}
