import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeToggle } from "@/components/mode-toggle";

export function SiteControls() {
  return (
    <div className="flex items-center gap-2">
      <LocaleSwitcher />
      <ModeToggle />
    </div>
  );
}
