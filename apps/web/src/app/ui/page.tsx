import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { UiWorkbench } from "@/components/ui-workbench";
import { Button } from "@/components/ui/button";

export default function UiWorkbenchPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:px-8">
      <Button variant="ghost" asChild className="mb-8">
        <Link href="/">
          <ArrowLeftIcon data-icon="inline-start" />
          Back to Threshold
        </Link>
      </Button>
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">Design system</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">UI workbench</h1>
        <p className="mt-3 text-muted-foreground">
          Runtime verification for the shared shadcn components, forms, and data table foundation.
        </p>
      </div>
      <UiWorkbench />
    </main>
  );
}
