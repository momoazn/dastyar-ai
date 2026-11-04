import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { NavItem } from "@/components/sidebar/nav";
import { useEnabledNavItems } from "@/components/sidebar/use-enabled-nav-items";
import { Button } from "@/components/ui";
import { fa } from "@/lib/texts";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const descriptions: Record<NonNullable<NavItem["featureKey"]>, string> = {
  enable_chat: fa.index.chatDescription,
  enable_image_generation: fa.index.imageDescription,
  enable_code_execution: fa.index.codeDescription,
  enable_translation: fa.index.translationDescription,
  enable_summary: fa.summarize.description,
  enable_transcription: fa.transcribe.description,
};

function HomeComponent() {
  const tools = useEnabledNavItems();
  const primary = tools[0];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-linear-to-b from-background to-muted/30">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-8 md:py-14">
        <header className="space-y-4">
          <p className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 font-medium text-primary text-xs">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            {fa.index.localFirstBadge}
          </p>
          <h1 className="max-w-3xl text-balance font-bold text-3xl leading-tight md:text-5xl">
            {fa.index.appTitle}
          </h1>
          <p className="max-w-2xl text-pretty text-muted-foreground leading-8 md:text-lg">
            {fa.index.description}
          </p>
          {primary && (
            <Button asChild className="w-full sm:w-auto" size="lg">
              <Link to={primary.url}>
                {primary.featureKey === "enable_chat"
                  ? fa.index.startChat
                  : primary.title}
                <ArrowLeft aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          )}
        </header>

        <section aria-labelledby="tools-heading" className="space-y-4">
          <h2
            className="font-semibold text-muted-foreground text-sm"
            id="tools-heading"
          >
            {fa.index.toolsHeading}
          </h2>
          {tools.length === 0 ? (
            <p className="text-muted-foreground">{fa.index.noTools}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {tools.map((tool) => (
                <li key={tool.url}>
                  <Link
                    className="group flex h-full items-start gap-4 rounded-xl border bg-card p-5 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    to={tool.url}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <tool.icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <span className="flex items-center justify-between gap-2 font-semibold">
                        {tool.title}
                        <ArrowLeft
                          aria-hidden="true"
                          className="group-hover:-translate-x-1 size-4 text-muted-foreground transition-transform group-hover:text-primary"
                        />
                      </span>
                      {tool.featureKey && (
                        <span className="block text-muted-foreground text-sm leading-6">
                          {descriptions[tool.featureKey]}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
