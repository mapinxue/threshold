import { rm } from "node:fs/promises";

await Promise.all([
  rm(".next/types", { recursive: true, force: true }),
  rm(".next/dev/types", { recursive: true, force: true }),
]);
