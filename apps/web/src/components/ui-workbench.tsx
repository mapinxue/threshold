"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontalIcon, PlusIcon, ShieldCheckIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const connectionSchema = z.object({
  name: z.string().trim().min(2, "Enter at least two characters."),
  engine: z.enum(["postgresql", "mysql"]),
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

type DataSource = {
  name: string;
  engine: "PostgreSQL" | "MySQL";
  classification: string;
  status: "Connected" | "Review";
};

const dataSources: DataSource[] = [
  {
    name: "Production analytics",
    engine: "PostgreSQL",
    classification: "Confidential",
    status: "Connected",
  },
  {
    name: "Customer support",
    engine: "MySQL",
    classification: "Restricted",
    status: "Review",
  },
];

const columns: ColumnDef<DataSource>[] = [
  { accessorKey: "name", header: "Data source" },
  { accessorKey: "engine", header: "Engine" },
  { accessorKey: "classification", header: "Classification" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "Connected" ? "secondary" : "outline"}>
        {row.original.status}
      </Badge>
    ),
  },
];

export function UiWorkbench() {
  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues: { name: "", engine: "postgresql" },
  });
  // TanStack Table intentionally exposes non-memoizable callbacks through its table instance.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: dataSources,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function onSubmit(values: ConnectionFormValues) {
    toast.success("Connection draft validated", {
      description: `${values.name} · ${values.engine}`,
    });
  }

  return (
    <Tabs defaultValue="components" className="gap-6">
      <TabsList>
        <TabsTrigger value="components">Components</TabsTrigger>
        <TabsTrigger value="form">Form</TabsTrigger>
        <TabsTrigger value="table">Data table</TabsTrigger>
      </TabsList>

      <TabsContent value="components" className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions and overlays</CardTitle>
            <CardDescription>Dialogs, sheets, confirmation, menus, and feedback.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon data-icon="inline-start" />
                  Add source
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a data source</DialogTitle>
                  <DialogDescription>
                    Connection credentials will be stored using the configured secrets provider.
                  </DialogDescription>
                </DialogHeader>
                <Field>
                  <FieldLabel htmlFor="dialog-source">Display name</FieldLabel>
                  <Input id="dialog-source" placeholder="Production warehouse" />
                </Field>
                <DialogFooter>
                  <Button onClick={() => toast.info("Demo action only")}>Continue</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open details</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Policy details</SheetTitle>
                  <SheetDescription>
                    Inspect resource scopes and masking decisions without leaving the page.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Revoke access</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke agent access?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Active queries will finish, but new queries will be denied immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Revoke</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open actions">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Data source</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Test connection</DropdownMenuItem>
                <DropdownMenuItem>View audit events</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Policy verified">
                  <ShieldCheckIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Policy verified</TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loading and status</CardTitle>
            <CardDescription>Badges, skeletons, and toast notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge>Protected</Badge>
              <Badge variant="secondary">Connected</Badge>
              <Badge variant="outline">Pending review</Badge>
              <Badge variant="destructive">Denied</Badge>
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" onClick={() => toast.success("Policy saved")}>
              Show toast
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="form">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Register data source</CardTitle>
            <CardDescription>React Hook Form with a Zod schema and shadcn fields.</CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <CardContent>
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="Production analytics"
                      />
                      <FieldDescription>A name operators can recognize.</FieldDescription>
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="engine"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Database engine</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select an engine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                          <SelectItem value="mysql">MySQL</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="mt-6 justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => form.reset()}>
                Reset
              </Button>
              <Button type="submit">Validate draft</Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="table">
        <Card>
          <CardHeader>
            <CardTitle>Data sources</CardTitle>
            <CardDescription>
              TanStack Table renders through the shared shadcn table primitives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
