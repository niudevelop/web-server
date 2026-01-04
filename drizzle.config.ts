import { defineConfig } from "drizzle-kit";
import type { MigrationConfig } from "drizzle-orm/migrator";
import { config } from "./src/config";

export default defineConfig({
  schema: "src/db/schema.ts",
  out: "src/db/gen",
  dialect: "postgresql",
  dbCredentials: {
    url: config.db.url,
  },
});

export const migrationConfig: MigrationConfig = {
  migrationsFolder: "src/db/gen",
};
