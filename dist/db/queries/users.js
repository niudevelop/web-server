import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { users } from "../schema.js";
export async function createUser(user) {
    const [result] = await db.insert(users).values(user).onConflictDoNothing().returning();
    return result;
}
export async function getUser(value, by) {
    if (by === "id") {
        const [result] = await db.select().from(users).where(eq(users.id, value));
        return result;
    }
    const [result] = await db.select().from(users).where(eq(users.email, value));
    return result;
}
export async function updateUser(userId, updates) {
    const [updated] = await db
        .update(users)
        .set({
        email: updates.email,
        hashed_password: updates.hashed_password,
        updatedAt: new Date(),
    })
        .where(eq(users.id, userId))
        .returning();
    return updated;
}
export async function setUserChirpyRed(userId) {
    const [updated] = await db
        .update(users)
        .set({
        is_chirpy_red: true,
    })
        .where(eq(users.id, userId))
        .returning();
    return updated;
}
export async function deleteAllUsers() {
    await db.delete(users);
}
