import { ArrowRightIcon, DatabaseZapIcon, ShieldCheckIcon, ScanSearchIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const capabilities = [
  {
    title: "Policy first",
    description: "Authorize every agent, data source, table, column, and query purpose.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Safe execution",
    description: "Parse, validate, rewrite, limit, and audit SQL before database execution.",
    icon: ScanSearchIcon,
  },
  {
    title: "Protected results",
    description: "Classify sensitive data and enforce masking before results leave the gateway.",
    icon: DatabaseZapIcon,
  },
] as const;

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 pb-16 lg:px-8">
      <nav className="flex h-20 items-center justify-between border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            T
          </span>
          Threshold
        </Link>
        <Badge variant="outline" className="gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Foundation ready
        </Badge>
      </nav>

      <section className="py-24 sm:py-32">
        <Badge variant="secondary">AI database security gateway</Badge>
        <h1 className="mt-6 max-w-5xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-7xl lg:text-8xl">
          Give agents access to data, not unrestricted databases.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">
          Threshold is the governed layer between AI agents and production data: permissions, SQL
          safety, masking, execution limits, and complete auditability.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <a href="http://localhost:8000/docs">
              Open API documentation
              <ArrowRightIcon data-icon="inline-end" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/ui">View UI workbench</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 border-t pt-8 md:grid-cols-3" aria-label="Core capabilities">
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
