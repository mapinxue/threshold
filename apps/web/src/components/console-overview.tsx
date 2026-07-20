"use client";

import {
  ActivityIcon,
  BotIcon,
  DatabaseIcon,
  PlusIcon,
  ShieldCheckIcon,
  TagsIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { SiteControls } from "@/components/site-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";

const metrics = [
  { key: "sources", value: "2", icon: DatabaseIcon },
  { key: "protectedFields", value: "128", icon: TagsIcon },
  { key: "policies", value: "12", icon: ShieldCheckIcon },
  { key: "queries", value: "1,284", icon: ActivityIcon },
] as const;

export function ConsoleOverview() {
  const t = useTranslations("Console");

  const sources = [
    {
      name: t("table.productionAnalytics"),
      engine: "PostgreSQL",
      classification: t("table.confidential"),
      status: t("table.connected"),
      connected: true,
    },
    {
      name: t("table.customerSupport"),
      engine: "MySQL",
      classification: t("table.restricted"),
      status: t("table.review"),
      connected: false,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                T
              </span>
              Threshold
            </Link>
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-sm text-muted-foreground sm:block">{t("product")}</span>
          </div>
          <SiteControls />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t("environment")}</Badge>
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground">{t("overview")}</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("description")}</p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon data-icon="inline-start" />
                {t("addSource")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("dialog.title")}</DialogTitle>
                <DialogDescription>{t("dialog.description")}</DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="source-name">{t("dialog.name")}</FieldLabel>
                  <Input id="source-name" placeholder={t("dialog.namePlaceholder")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="source-engine">{t("dialog.engine")}</FieldLabel>
                  <Select defaultValue="postgresql">
                    <SelectTrigger id="source-engine">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t("dialog.cancel")}</Button>
                </DialogClose>
                <Button>{t("dialog.continue")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <Card key={metric.key} size="sm">
                <CardHeader>
                  <CardDescription>{t(`metrics.${metric.key}`)}</CardDescription>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Tabs defaultValue="sources" className="mt-8 gap-4">
          <TabsList>
            <TabsTrigger value="sources">{t("tabs.sources")}</TabsTrigger>
            <TabsTrigger value="activity">{t("tabs.activity")}</TabsTrigger>
          </TabsList>

          <TabsContent value="sources">
            <Card>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("table.name")}</TableHead>
                        <TableHead>{t("table.engine")}</TableHead>
                        <TableHead>{t("table.classification")}</TableHead>
                        <TableHead>{t("table.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sources.map((source) => (
                        <TableRow key={source.name}>
                          <TableCell className="font-medium">{source.name}</TableCell>
                          <TableCell>{source.engine}</TableCell>
                          <TableCell>{source.classification}</TableCell>
                          <TableCell>
                            <Badge variant={source.connected ? "secondary" : "outline"}>
                              {source.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
                <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
                  <BotIcon className="size-5 text-muted-foreground" />
                </span>
                <CardTitle className="mt-5">{t("activity.title")}</CardTitle>
                <CardDescription className="mt-2 max-w-md">
                  {t("activity.description")}
                </CardDescription>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
