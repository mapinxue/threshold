import type messages from "../../messages/zh-CN.json";

import type { AppLocale } from "@/i18n/routing";

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
