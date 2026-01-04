process.loadEnvFile();
export const config = {
    fileserverHits: 0,
    db: {
        url: process.env.DB_URL,
        migrationConfig: {
            migrationsFolder: "src/db/gen",
        },
    },
    platform: process.env.PLATFORM,
    jwtSecret: process.env.JWT_SECRET,
    polkaKey: process.env.POLKA_KEY,
};
console.log(config.polkaKey);
