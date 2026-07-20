"use client";

import {
  ActivityIcon,
  DatabaseIcon,
  KeyRoundIcon,
  LogOutIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersIcon,
  WandSparklesIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteControls } from "@/components/site-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import {
  ApiError,
  type ApiKey,
  type ApiKeyCreated,
  type AuthResponse,
  type Dashboard,
  type DataSource,
  type Permission,
  type Skill,
  type User,
  apiRequest,
} from "@/lib/api";

const SESSION_KEY = "threshold.session";
const selectClassName =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function value(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function AuthPanel({ onAuthenticated }: { onAuthenticated: (session: AuthResponse) => void }) {
  const t = useTranslations("App");
  const [submitting, setSubmitting] = useState(false);

  async function authenticate(path: "/auth/login" | "/auth/register", body: object) {
    setSubmitting(true);
    try {
      const response = await apiRequest<AuthResponse>(path, { method: "POST", body });
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(response));
      onAuthenticated(response);
      toast.success(t("auth.success"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void authenticate("/auth/login", {
      email: value(form, "email"),
      password: value(form, "password"),
    });
  }

  function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void authenticate("/auth/register", {
      tenant_name: value(form, "tenant_name"),
      display_name: value(form, "display_name"),
      email: value(form, "email"),
      password: value(form, "password"),
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground">
            T
          </div>
          <CardTitle>{t("auth.title")}</CardTitle>
          <CardDescription>{t("auth.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">
                {t("auth.login")}
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                {t("auth.register")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="pt-4">
              <form onSubmit={submitLogin}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="login-email">{t("fields.email")}</FieldLabel>
                    <Input id="login-email" name="email" type="email" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="login-password">{t("fields.password")}</FieldLabel>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      minLength={8}
                      required
                    />
                  </Field>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? t("actions.working") : t("auth.login")}
                  </Button>
                </FieldGroup>
              </form>
            </TabsContent>
            <TabsContent value="register" className="pt-4">
              <form onSubmit={submitRegister}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="tenant-name">{t("fields.tenant")}</FieldLabel>
                    <Input id="tenant-name" name="tenant_name" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="display-name">{t("fields.name")}</FieldLabel>
                    <Input id="display-name" name="display_name" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="register-email">{t("fields.email")}</FieldLabel>
                    <Input id="register-email" name="email" type="email" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="register-password">{t("fields.password")}</FieldLabel>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      minLength={8}
                      required
                    />
                  </Field>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? t("actions.working") : t("auth.register")}
                  </Button>
                </FieldGroup>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export function ConsoleOverview() {
  const t = useTranslations("App");
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(SESSION_KEY);
      if (stored !== null) {
        try {
          setSession(JSON.parse(stored) as AuthResponse);
        } catch {
          window.localStorage.removeItem(SESSION_KEY);
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const refresh = useCallback(async (active: AuthResponse) => {
    setLoading(true);
    try {
      const [summary, dataSources, apiKeys, generatedSkills] = await Promise.all([
        apiRequest<Dashboard>("/dashboard", { token: active.access_token }),
        apiRequest<DataSource[]>("/data-sources", { token: active.access_token }),
        apiRequest<ApiKey[]>("/api-keys", { token: active.access_token }),
        apiRequest<Skill[]>("/skills", { token: active.access_token }),
      ]);
      setDashboard(summary);
      setSources(dataSources);
      setKeys(apiKeys);
      setSkills(generatedSkills);

      if (active.user.role === "admin") {
        const [tenantUsers, tenantPermissions] = await Promise.all([
          apiRequest<User[]>("/admin/users", { token: active.access_token }),
          apiRequest<Permission[]>("/admin/permissions", { token: active.access_token }),
        ]);
        setUsers(tenantUsers);
        setPermissions(tenantPermissions);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.localStorage.removeItem(SESSION_KEY);
        setSession(null);
      } else {
        toast.error(error instanceof Error ? error.message : "Request failed");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load server state after authentication changes
      void refresh(session);
    }
  }, [refresh, session]);

  async function mutate(action: () => Promise<unknown>, message: string) {
    if (session === null) return;
    try {
      await action();
      toast.success(message);
      await refresh(session);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generic"));
    }
  }

  function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (session === null) return;
    const form = new FormData(event.currentTarget);
    const port = value(form, "port");
    void mutate(
      () =>
        apiRequest<DataSource>("/data-sources", {
          method: "POST",
          token: session.access_token,
          body: {
            name: value(form, "name"),
            engine: value(form, "engine"),
            host: value(form, "host") || null,
            port: port === "" ? null : Number(port),
            database_name: value(form, "database_name") || null,
            owner_user_id: value(form, "owner_user_id") || null,
            status: "connected",
          },
        }),
      t("messages.sourceCreated"),
    );
    event.currentTarget.reset();
  }

  function submitKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (session === null) return;
    const form = new FormData(event.currentTarget);
    void (async () => {
      try {
        const created = await apiRequest<ApiKeyCreated>("/api-keys", {
          method: "POST",
          token: session.access_token,
          body: { name: value(form, "name") },
        });
        setNewSecret(created.secret);
        toast.success(t("messages.keyCreated"));
        await refresh(session);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("errors.generic"));
      }
    })();
    event.currentTarget.reset();
  }

  function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (session === null) return;
    const form = new FormData(event.currentTarget);
    void mutate(
      () =>
        apiRequest<User>("/admin/users", {
          method: "POST",
          token: session.access_token,
          body: {
            display_name: value(form, "display_name"),
            email: value(form, "email"),
            password: value(form, "password"),
            role: value(form, "role"),
          },
        }),
      t("messages.userCreated"),
    );
    event.currentTarget.reset();
  }

  function submitPermission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (session === null) return;
    const form = new FormData(event.currentTarget);
    void mutate(
      () =>
        apiRequest<Permission>("/admin/permissions", {
          method: "POST",
          token: session.access_token,
          body: {
            user_id: value(form, "user_id"),
            data_source_id: value(form, "data_source_id"),
            access_level: value(form, "access_level"),
          },
        }),
      t("messages.permissionCreated"),
    );
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (session === null) return;
    const form = new FormData(event.currentTarget);
    const displayName = value(form, "display_name");
    void (async () => {
      try {
        const user = await apiRequest<User>("/auth/me", {
          method: "PATCH",
          token: session.access_token,
          body: { display_name: displayName },
        });
        const updated = { ...session, user };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        setSession(updated);
        toast.success(t("messages.profileUpdated"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("errors.generic"));
      }
    })();
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-muted/20" />;
  }
  if (session === null) {
    return <AuthPanel onAuthenticated={setSession} />;
  }

  const metrics = [
    { label: t("metrics.users"), value: dashboard?.users ?? 0, icon: UsersIcon },
    { label: t("metrics.sources"), value: dashboard?.data_sources ?? 0, icon: DatabaseIcon },
    { label: t("metrics.keys"), value: dashboard?.api_keys ?? 0, icon: KeyRoundIcon },
    { label: t("metrics.permissions"), value: dashboard?.permissions ?? 0, icon: ShieldCheckIcon },
    { label: t("metrics.skills"), value: dashboard?.skills ?? 0, icon: WandSparklesIcon },
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
            <Badge variant="outline">
              {session.user.role === "admin" ? t("roles.admin") : t("roles.user")}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">
              {session.user.display_name}
            </span>
            <SiteControls />
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("actions.logout")}
              onClick={() => {
                void apiRequest<void>("/auth/logout", {
                  method: "POST",
                  token: session.access_token,
                }).catch(() => undefined);
                window.localStorage.removeItem(SESSION_KEY);
                setSession(null);
              }}
            >
              <LogOutIcon />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div>
          <Badge variant="outline">{session.tenant_slug}</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("description")}</p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map(({ label, value: metricValue, icon: Icon }) => (
            <Card key={label} size="sm">
              <CardHeader>
                <CardDescription>{label}</CardDescription>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{metricValue}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Tabs defaultValue="sources" className="mt-8 gap-5">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="sources">
              <DatabaseIcon />
              {t("tabs.sources")}
            </TabsTrigger>
            <TabsTrigger value="keys">
              <KeyRoundIcon />
              {t("tabs.keys")}
            </TabsTrigger>
            <TabsTrigger value="skills">
              <WandSparklesIcon />
              {t("tabs.skills")}
            </TabsTrigger>
            <TabsTrigger value="profile">
              <UserRoundIcon />
              {t("tabs.profile")}
            </TabsTrigger>
            {session.user.role === "admin" && (
              <TabsTrigger value="users">
                <UsersIcon />
                {t("tabs.users")}
              </TabsTrigger>
            )}
            {session.user.role === "admin" && (
              <TabsTrigger value="permissions">
                <ShieldCheckIcon />
                {t("tabs.permissions")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="sources">
            <SectionCard
              title={t("sources.title")}
              description={t("sources.description")}
              action={
                session.user.role === "admin" ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusIcon />
                        {t("sources.add")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("sources.add")}</DialogTitle>
                        <DialogDescription>{t("sources.addDescription")}</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={submitSource}>
                        <FieldGroup>
                          <Field>
                            <FieldLabel>{t("fields.name")}</FieldLabel>
                            <Input name="name" required />
                          </Field>
                          <Field>
                            <FieldLabel>{t("fields.engine")}</FieldLabel>
                            <select
                              name="engine"
                              className={selectClassName}
                              defaultValue="postgresql"
                            >
                              <option value="postgresql">PostgreSQL</option>
                              <option value="mysql">MySQL</option>
                              <option value="snowflake">Snowflake</option>
                            </select>
                          </Field>
                          <div className="grid grid-cols-3 gap-3">
                            <Field className="col-span-2">
                              <FieldLabel>{t("fields.host")}</FieldLabel>
                              <Input name="host" />
                            </Field>
                            <Field>
                              <FieldLabel>{t("fields.port")}</FieldLabel>
                              <Input name="port" type="number" />
                            </Field>
                          </div>
                          <Field>
                            <FieldLabel>{t("fields.database")}</FieldLabel>
                            <Input name="database_name" />
                          </Field>
                          <Field>
                            <FieldLabel>{t("fields.owner")}</FieldLabel>
                            <select
                              name="owner_user_id"
                              className={selectClassName}
                              defaultValue={session.user.id}
                            >
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.email}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <DialogFooter>
                            <Button type="submit">{t("actions.create")}</Button>
                          </DialogFooter>
                        </FieldGroup>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : undefined
              }
            >
              <DataTable
                headers={[
                  t("fields.name"),
                  t("fields.engine"),
                  t("fields.host"),
                  t("fields.status"),
                  t("actions.actions"),
                ]}
                empty={t("empty.sources")}
              >
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>{source.engine}</TableCell>
                    <TableCell>{source.host ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{source.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {session.user.role === "admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void mutate(
                              () =>
                                apiRequest<void>(`/data-sources/${source.id}`, {
                                  method: "DELETE",
                                  token: session.access_token,
                                }),
                              t("messages.deleted"),
                            )
                          }
                        >
                          {t("actions.delete")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </DataTable>
            </SectionCard>
          </TabsContent>

          <TabsContent value="keys">
            <SectionCard
              title={t("keys.title")}
              description={t("keys.description")}
              action={
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon />
                      {t("keys.add")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("keys.add")}</DialogTitle>
                      <DialogDescription>{t("keys.warning")}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitKey}>
                      <FieldGroup>
                        <Field>
                          <FieldLabel>{t("fields.name")}</FieldLabel>
                          <Input name="name" required />
                        </Field>
                        <DialogFooter>
                          <Button type="submit">{t("actions.create")}</Button>
                        </DialogFooter>
                      </FieldGroup>
                    </form>
                  </DialogContent>
                </Dialog>
              }
            >
              {newSecret !== null && (
                <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm font-medium">{t("keys.copyNow")}</p>
                  <code className="mt-2 block break-all text-sm">{newSecret}</code>
                </div>
              )}
              <DataTable
                headers={[
                  t("fields.name"),
                  t("keys.prefix"),
                  t("fields.created"),
                  t("actions.actions"),
                ]}
                empty={t("empty.keys")}
              >
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code>{key.key_prefix}…</code>
                    </TableCell>
                    <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void mutate(
                            () =>
                              apiRequest<void>(`/api-keys/${key.id}`, {
                                method: "DELETE",
                                token: session.access_token,
                              }),
                            t("messages.deleted"),
                          )
                        }
                      >
                        {t("actions.delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </DataTable>
            </SectionCard>
          </TabsContent>

          <TabsContent value="skills">
            <SectionCard
              title={t("skills.title")}
              description={t("skills.description")}
              action={
                session.user.role === "admin" && sources.length > 0 ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      void mutate(
                        () =>
                          apiRequest<Skill>("/skills/generate", {
                            method: "POST",
                            token: session.access_token,
                            body: { data_source_id: value(form, "data_source_id") },
                          }),
                        t("messages.skillGenerated"),
                      );
                    }}
                  >
                    <select name="data_source_id" className={selectClassName}>
                      {sources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit">
                      <WandSparklesIcon />
                      {t("skills.generate")}
                    </Button>
                  </form>
                ) : undefined
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                {skills.map((skill) => (
                  <Card key={skill.id} size="sm">
                    <CardHeader>
                      <CardTitle>{skill.name}</CardTitle>
                      <Badge variant="secondary">{skill.data_source_name}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{skill.description}</p>
                      <pre className="mt-4 max-h-36 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                        {skill.content}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
                {skills.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("empty.skills")}</p>
                )}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="profile">
            <SectionCard title={t("profile.title")} description={session.user.email}>
              <form className="max-w-md" onSubmit={submitProfile}>
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t("fields.name")}</FieldLabel>
                    <Input name="display_name" defaultValue={session.user.display_name} required />
                  </Field>
                  <Field>
                    <FieldLabel>{t("fields.role")}</FieldLabel>
                    <Input value={session.user.role} disabled />
                  </Field>
                  <Button type="submit">{t("actions.save")}</Button>
                </FieldGroup>
              </form>
            </SectionCard>
          </TabsContent>

          {session.user.role === "admin" && (
            <TabsContent value="users">
              <SectionCard
                title={t("users.title")}
                description={t("users.description")}
                action={
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusIcon />
                        {t("users.add")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("users.add")}</DialogTitle>
                        <DialogDescription>{t("users.addDescription")}</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={submitUser}>
                        <FieldGroup>
                          <Field>
                            <FieldLabel>{t("fields.name")}</FieldLabel>
                            <Input name="display_name" required />
                          </Field>
                          <Field>
                            <FieldLabel>{t("fields.email")}</FieldLabel>
                            <Input name="email" type="email" required />
                          </Field>
                          <Field>
                            <FieldLabel>{t("fields.password")}</FieldLabel>
                            <Input name="password" type="password" minLength={8} required />
                          </Field>
                          <Field>
                            <FieldLabel>{t("fields.role")}</FieldLabel>
                            <select name="role" className={selectClassName}>
                              <option value="user">{t("roles.user")}</option>
                              <option value="admin">{t("roles.admin")}</option>
                            </select>
                          </Field>
                          <DialogFooter>
                            <Button type="submit">{t("actions.create")}</Button>
                          </DialogFooter>
                        </FieldGroup>
                      </form>
                    </DialogContent>
                  </Dialog>
                }
              >
                <DataTable
                  headers={[
                    t("fields.name"),
                    t("fields.email"),
                    t("fields.role"),
                    t("fields.status"),
                    t("actions.actions"),
                  ]}
                  empty={t("empty.users")}
                >
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.display_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "secondary" : "outline"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-1">
                        {user.id !== session.user.id && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void mutate(
                                  () =>
                                    apiRequest<User>(`/admin/users/${user.id}/status`, {
                                      method: "PATCH",
                                      token: session.access_token,
                                      body: {
                                        status: user.status === "active" ? "disabled" : "active",
                                      },
                                    }),
                                  t("messages.userUpdated"),
                                )
                              }
                            >
                              {user.status === "active"
                                ? t("actions.disable")
                                : t("actions.enable")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                void mutate(
                                  () =>
                                    apiRequest<void>(`/admin/users/${user.id}`, {
                                      method: "DELETE",
                                      token: session.access_token,
                                    }),
                                  t("messages.deleted"),
                                )
                              }
                            >
                              {t("actions.delete")}
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </DataTable>
              </SectionCard>
            </TabsContent>
          )}

          {session.user.role === "admin" && (
            <TabsContent value="permissions">
              <SectionCard
                title={t("permissions.title")}
                description={t("permissions.description")}
                action={
                  users.length > 0 && sources.length > 0 ? (
                    <form className="flex flex-wrap gap-2" onSubmit={submitPermission}>
                      <select name="user_id" className={selectClassName}>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.email}
                          </option>
                        ))}
                      </select>
                      <select name="data_source_id" className={selectClassName}>
                        {sources.map((source) => (
                          <option key={source.id} value={source.id}>
                            {source.name}
                          </option>
                        ))}
                      </select>
                      <select name="access_level" className={selectClassName}>
                        <option value="read">read</option>
                        <option value="write">write</option>
                        <option value="admin">admin</option>
                      </select>
                      <Button type="submit">
                        <PlusIcon />
                        {t("actions.grant")}
                      </Button>
                    </form>
                  ) : undefined
                }
              >
                <DataTable
                  headers={[
                    t("fields.user"),
                    t("fields.source"),
                    t("fields.access"),
                    t("actions.actions"),
                  ]}
                  empty={t("empty.permissions")}
                >
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>{permission.user_email}</TableCell>
                      <TableCell>{permission.data_source_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.access_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void mutate(
                              () =>
                                apiRequest<void>(`/admin/permissions/${permission.id}`, {
                                  method: "DELETE",
                                  token: session.access_token,
                                }),
                              t("messages.deleted"),
                            )
                          }
                        >
                          {t("actions.delete")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </DataTable>
              </SectionCard>
            </TabsContent>
          )}
        </Tabs>
        {loading && (
          <div className="fixed right-6 bottom-6 flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm shadow-lg">
            <ActivityIcon className="size-4 animate-pulse" />
            {t("actions.loading")}
          </div>
        )}
      </main>
    </div>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DataTable({
  headers,
  empty,
  children,
}: {
  headers: string[];
  empty: string;
  children: React.ReactNode;
}) {
  const rows = Array.isArray(children) ? children.length : children ? 1 : 0;
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows > 0 ? (
            children
          ) : (
            <TableRow>
              <TableCell
                colSpan={headers.length}
                className="h-24 text-center text-muted-foreground"
              >
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
