"use client";

import { LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

const locales: AppLocale[] = ["zh-CN", "en"];

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeLocale(nextLocale: AppLocale) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-24" disabled={isPending}>
          <LanguagesIcon data-icon="inline-start" />
          {t(`languages.${locale}`)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((item) => (
          <DropdownMenuItem
            key={item}
            onClick={() => changeLocale(item)}
            disabled={item === locale}
          >
            {t(`languages.${item}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
