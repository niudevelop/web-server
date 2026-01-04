import { eq, gt, isNull, and } from "drizzle-orm";
import { db } from "../index.js";
import { refreshTokens, users } from "../schema.js";
export async function createRefreshToken(row) {
    const [created] = await db.insert(refreshTokens).values(row).returning();
    return created;
}
export async function getRefreshToken(token) {
    const [found] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
    return found;
}
export async function getUserFromRefreshToken(token) {
    const now = new Date();
    const [row] = await db
        .select({ id: users.id })
        .from(refreshTokens)
        .innerJoin(users, eq(users.id, refreshTokens.userId))
        .where(and(eq(refreshTokens.token, token), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, now)));
    return row ?? null;
}
export async function revokeRefreshToken(token) {
    const now = new Date();
    await db
        .update(refreshTokens)
        .set({
        revokedAt: now,
        updatedAt: now,
    })
        .where(eq(refreshTokens.token, token));
}
