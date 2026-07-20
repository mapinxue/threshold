import { setRequestLocale } from "next-intl/server";

import { ConsoleOverview } from "@/components/console-overview";
import type { AppLocale } from "@/i18n/routing";

type ConsolePageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function ConsolePage({ params }: ConsolePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ConsoleOverview />;
}
