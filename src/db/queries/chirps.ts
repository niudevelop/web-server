import { asc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { chirps, type NewChirp } from "../schema.js";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db.insert(chirps).values(chirp).onConflictDoNothing().returning();
  return result;
}

export async function getChirps() {
  const result = await db.select().from(chirps).orderBy(asc(chirps.createdAt));
  return result;
}
export async function getChirp(chirpID: string) {
  const [result] = await db.select().from(chirps).where(eq(chirps.id, chirpID));
  return result;
}

export async function deleteAllChirps() {
  await db.delete(chirps);
}

export async function deleteChirp(chirpID: string) {
  const [deleted] = await db.delete(chirps).where(eq(chirps.id, chirpID)).returning();
  return deleted ?? null;
}
