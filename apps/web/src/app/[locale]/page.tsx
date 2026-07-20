import { ArrowRightIcon, DatabaseZapIcon, ShieldCheckIcon, ScanSearchIcon } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteControls } from "@/components/site-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type LandingPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");

  const capabilities = [
    {
      title: t("capabilities.policy.title"),
      description: t("capabilities.policy.description"),
      icon: ShieldCheckIcon,
    },
    {
      title: t("capabilities.execution.title"),
      description: t("capabilities.execution.description"),
      icon: ScanSearchIcon,
    },
    {
      title: t("capabilities.results.title"),
      description: t("capabilities.results.description"),
      icon: DatabaseZapIcon,
    },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 pb-16 lg:px-8">
      <nav className="flex h-20 items-center justify-between border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            T
          </span>
          Threshold
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden gap-1.5 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {t("status")}
          </Badge>
          <SiteControls />
        </div>
      </nav>

      <section className="py-24 sm:py-32">
        <Badge variant="secondary">{t("eyebrow")}</Badge>
        <h1 className="mt-6 max-w-5xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-7xl lg:text-8xl">
          {t("title")}
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">{t("description")}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/console">
              {t("enterConsole")}
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="http://localhost:8000/docs">{t("apiDocs")}</a>
          </Button>
        </div>
      </section>

      <section
        className="grid gap-4 border-t pt-8 md:grid-cols-3"
        aria-label={t("capabilitiesLabel")}
      >
        {capabilities.map((capability) => {
          const Icon = capability.icon;

          return (
            <Card key={capability.title}>
              <CardHeader>
                <span className="mb-6 flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4" />
                </span>
                <CardTitle>{capability.title}</CardTitle>
                <CardDescription>{capability.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
