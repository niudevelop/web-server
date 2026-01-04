import { asc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { chirps } from "../schema.js";
export async function createChirp(chirp) {
    const [result] = await db.insert(chirps).values(chirp).onConflictDoNothing().returning();
    return result;
}
export async function getChirps() {
    const result = await db.select().from(chirps).orderBy(asc(chirps.createdAt));
    return result;
}
export async function getChirp(chirpID) {
    const [result] = await db.select().from(chirps).where(eq(chirps.id, chirpID));
    return result;
}
export async function deleteAllChirps() {
    await db.delete(chirps);
}
export async function deleteChirp(chirpID) {
    const [deleted] = await db.delete(chirps).where(eq(chirps.id, chirpID)).returning();
    return deleted ?? null;
}
