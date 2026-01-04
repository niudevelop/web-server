import type { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile();

export type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

export type APIConfig = {
  db: DBConfig;
  fileserverHits: number;
  platform: string;
  jwtSecret: string;
  polkaKey: string;
};
export const config: APIConfig = {
  fileserverHits: 0,
  db: {
    url: process.env.DB_URL as string,
    migrationConfig: {
      migrationsFolder: "src/db/gen",
    },
  },
  platform: process.env.PLATFORM as string,
  jwtSecret: process.env.JWT_SECRET as string,
  polkaKey: process.env.POLKA_KEY as string,
};
console.log(config.polkaKey);
