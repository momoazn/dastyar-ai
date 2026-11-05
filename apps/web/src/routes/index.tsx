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
const engines = ["Ollama", "LM Studio", "Whisper", "Stable Diffusion"];

const container = "mx-auto w-full max-w-6xl px-4 md:px-8";
// The logo gradient, so the call-to-action band matches the brand mark.
const brandGradient = "bg-linear-to-br from-[#3AA0FF] to-[#1557C0]";

function LandingPage() {
  const token = useAtomValue(tokenAtom);
  const tools = useEnabledNavItems();
  const primary = token
    ? { label: fa.index.openApp, to: tools[0]?.url ?? "/chat/" }
    : { label: fa.index.login, to: "/login" };

  return (
    <div className="min-h-dvh bg-background">
      <Header
        actions={
          <Button asChild size="sm" variant={token ? "default" : "outline"}>
            <Link to={primary.to}>{primary.label}</Link>
          </Button>
        }
        className="border-border/60 border-b bg-background/75 backdrop-blur-md"
      />

      <main>
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="-z-10 absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000_30%,transparent_100%)]"
          />
          <div
            aria-hidden="true"
            className="-z-10 -top-48 -translate-x-1/2 absolute left-1/2 h-[28rem] w-[56rem] max-w-[140vw] rounded-full bg-primary/20 blur-3xl"
          />

          <div className={`${container} pt-14 pb-16 text-center md:pt-24`}>
            <p className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 font-medium text-primary text-xs shadow-xs backdrop-blur">
              <ShieldCheck aria-hidden="true" className="size-3.5" />
              {fa.index.localFirstBadge}
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance font-extrabold text-4xl leading-[1.35] tracking-tight md:text-7xl">
              {fa.index.heroTitle}{" "}
              <span className="bg-linear-to-l from-sky-400 to-primary bg-clip-text text-transparent">
                {fa.index.heroAccent}
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-muted-foreground leading-8 md:text-lg md:leading-9">
              {fa.index.description}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="shadow-lg shadow-primary/25" size="lg">
                <Link to={primary.to}>
                  {primary.label}
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="bg-background/80"
                size="lg"
                variant="outline"
              >
                {token ? (
                  <a href="#tools">{fa.index.seeTools}</a>
                ) : (
                  <Link to="/register">{fa.index.register}</Link>
                )}
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-muted-foreground text-sm">
              <span className="me-1">{fa.index.worksWith}</span>
              {engines.map((name) => (
                <span
                  className="rounded-md border bg-background/80 px-2.5 py-1 font-medium text-foreground/80 text-xs"
                  dir="ltr"
                  key={name}
                >
                  {name}
                </span>
              ))}
            </div>

            {/* The desktop screenshot is unreadable on phones, so it starts at sm. */}
            <div className="relative mx-auto mt-16 hidden max-w-5xl sm:block">
              <div
                aria-hidden="true"
                className="-z-10 -inset-x-8 absolute top-16 bottom-0 rounded-[3rem] bg-linear-to-b from-primary/30 to-sky-400/5 blur-3xl"
              />
              <figure className="overflow-hidden rounded-xl border bg-background shadow-2xl ring-1 ring-black/5 [mask-image:linear-gradient(to_bottom,#000_80%,transparent)]">
                <div
                  className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5"
                  dir="ltr"
                >
                  <span className="size-2.5 rounded-full bg-red-400/80" />
                  <span className="size-2.5 rounded-full bg-amber-400/80" />
                  <span className="size-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <img
                  alt={fa.index.previewAlt}
                  className="w-full dark:hidden"
                  height={1000}
                  src="/landing/chat.webp"
                  width={1600}
                />
                <img
                  alt={fa.index.previewAlt}
                  className="hidden w-full dark:block"
                  height={1000}
                  loading="lazy"
                  src="/landing/chat-dark.webp"
                  width={1600}
                />
              </figure>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="tools-heading"
          className="scroll-mt-16 border-y bg-sidebar py-16 md:py-24"
          id="tools"
        >
          <div className={container}>
            <div className="text-center">
              <p className="font-semibold text-primary text-sm">
                {fa.index.toolsHeading}
              </p>
              <h2
                className="mt-2 text-balance font-bold text-2xl md:text-4xl"
                id="tools-heading"
              >
                {fa.index.toolsTitle}
              </h2>
            </div>
            {tools.length === 0 ? (
              <p className="mt-10 text-center text-muted-foreground">
                {fa.index.noTools}
              </p>
            ) : (
              <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <li
                    className="rounded-2xl border bg-background p-6 shadow-xs"
                    key={tool.url}
                  >
                    <span
                      className={`flex size-11 items-center justify-center rounded-xl text-white shadow-md shadow-primary/20 ${brandGradient}`}
                    >
                      <tool.icon aria-hidden="true" className="size-5" />
                    </span>
                    <h3 className="mt-5 font-semibold text-lg">{tool.title}</h3>
                    {tool.featureKey && (
                      <p className="mt-1.5 text-muted-foreground text-sm leading-7">
                        {descriptions[tool.featureKey]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section aria-labelledby="why-heading" className="py-16 md:py-24">
          <div className={container}>
            <h2
              className="text-center font-bold text-2xl md:text-4xl"
              id="why-heading"
            >
              {fa.index.whyHeading}
            </h2>
            <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {fa.index.why.map((item, i) => {
                const Icon = whyIcons[i];
                return (
                  <li className="text-center" key={item.title}>
                    <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon aria-hidden="true" className="size-6" />
                    </span>
                    <h3 className="mt-5 font-semibold text-lg">{item.title}</h3>
                    <p className="mx-auto mt-2 max-w-sm text-muted-foreground leading-7">
                      {item.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className={`${container} pb-16 md:pb-24`}>
          <div
            className={`relative isolate overflow-hidden rounded-3xl px-6 py-14 text-center text-white md:py-20 ${brandGradient}`}
          >
            <div
              aria-hidden="true"
              className="-z-10 -top-24 -start-24 absolute size-72 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="-z-10 -bottom-32 -end-16 absolute size-80 rounded-full bg-sky-300/20 blur-3xl"
            />
            <h2 className="font-bold text-3xl md:text-4xl">
              {fa.index.ctaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-white/85 leading-8">
              {fa.index.ctaDescription}
            </p>
            <Button
              asChild
              className="mt-8 bg-white text-[#1557C0] shadow-lg hover:bg-white/90"
              size="lg"
            >
              <Link to={primary.to}>
                {primary.label}
                <ArrowLeft aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div
          className={`${container} flex flex-col items-center justify-between gap-3 py-6 text-muted-foreground text-sm sm:flex-row`}
        >
          <span className="flex items-center gap-2 font-medium text-foreground">
            <img
              alt=""
              className="size-6"
              height={24}
              src="/brand-logo.svg"
              width={24}
            />
            {fa.navigation.appTitle}
          </span>
          <span>{fa.index.footer}</span>
        </div>
      </footer>
    </div>
  );
}
