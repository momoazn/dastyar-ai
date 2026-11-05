import { createFileRoute, Link } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { ArrowLeft, Languages, ShieldCheck, Users } from "lucide-react";
import { tokenAtom } from "@/atoms/auth";
import { Header } from "@/components/header";
import type { NavItem } from "@/components/sidebar/nav";
import { useEnabledNavItems } from "@/components/sidebar/use-enabled-nav-items";
import { Button } from "@/components/ui";
import { fa } from "@/lib/texts";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const descriptions: Record<NonNullable<NavItem["featureKey"]>, string> = {
  enable_chat: fa.index.chatDescription,
  enable_image_generation: fa.index.imageDescription,
  enable_code_execution: fa.index.codeDescription,
  enable_translation: fa.index.translationDescription,
  enable_summary: fa.summarize.description,
  enable_transcription: fa.transcribe.description,
};

const whyIcons = [ShieldCheck, Languages, Users];

const section = "mx-auto w-full max-w-6xl px-4 md:px-8";

function LandingPage() {
  const token = useAtomValue(tokenAtom);
  const tools = useEnabledNavItems();
  const primary = token
    ? { label: fa.index.openApp, to: tools[0]?.url ?? "/chat/" }
    : { label: fa.index.login, to: "/login" };

  return (
    <div className="min-h-dvh bg-sidebar">
      <Header
        actions={
          <Button asChild size="sm" variant={token ? "default" : "outline"}>
            <Link to={primary.to}>{primary.label}</Link>
          </Button>
        }
      />

      <main>
        <section className={`${section} pt-10 pb-14 text-center md:pt-20`}>
          <p className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 font-medium text-primary text-xs">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            {fa.index.localFirstBadge}
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance font-bold text-4xl leading-tight md:text-6xl">
            {fa.index.appTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-muted-foreground leading-8 md:text-lg">
            {fa.index.description}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to={primary.to}>
                {primary.label}
                <ArrowLeft aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              {token ? (
                <a href="#tools">{fa.index.seeTools}</a>
              ) : (
                <Link to="/register">{fa.index.register}</Link>
              )}
            </Button>
          </div>

          <figure className="mx-auto mt-16 hidden max-w-5xl rounded-xl border bg-background p-1.5 shadow-2xl shadow-primary/10 sm:block">
            <img
              alt={fa.index.previewAlt}
              className="w-full rounded-lg dark:hidden"
              height={1000}
              src="/landing/chat.webp"
              width={1600}
            />
            <img
              alt={fa.index.previewAlt}
              className="hidden w-full rounded-lg dark:block"
              height={1000}
              loading="lazy"
              src="/landing/chat-dark.webp"
              width={1600}
            />
          </figure>
        </section>

        <section
          aria-labelledby="tools-heading"
          className="scroll-mt-16 border-y bg-background py-14 md:py-20"
          id="tools"
        >
          <div className={section}>
            <p className="font-semibold text-primary text-sm">
              {fa.index.toolsHeading}
            </p>
            <h2
              className="mt-2 font-bold text-2xl md:text-3xl"
              id="tools-heading"
            >
              {fa.index.toolsTitle}
            </h2>
            {tools.length === 0 ? (
              <p className="mt-8 text-muted-foreground">{fa.index.noTools}</p>
            ) : (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <li
                    className="flex items-start gap-4 rounded-xl border bg-card p-5"
                    key={tool.url}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <tool.icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0 space-y-1.5">
                      <span className="block font-semibold">{tool.title}</span>
                      {tool.featureKey && (
                        <span className="block text-muted-foreground text-sm leading-6">
                          {descriptions[tool.featureKey]}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section aria-labelledby="why-heading" className="py-14 md:py-20">
          <div className={section}>
            <h2 className="font-bold text-2xl md:text-3xl" id="why-heading">
              {fa.index.whyHeading}
            </h2>
            <ul className="mt-8 grid gap-8 md:grid-cols-3">
              {fa.index.why.map((item, i) => {
                const Icon = whyIcons[i];
                return (
                  <li className="space-y-3" key={item.title}>
                    <Icon aria-hidden="true" className="size-6 text-primary" />
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-muted-foreground leading-7">
                      {item.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div
          className={`${section} flex flex-col justify-between gap-2 py-6 text-muted-foreground text-sm sm:flex-row`}
        >
          <span>{fa.navigation.appTitle}</span>
          <span>{fa.index.footer}</span>
        </div>
      </footer>
    </div>
  );
}
