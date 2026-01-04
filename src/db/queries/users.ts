import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { type NewUser, type User, users } from "../schema.js";

export async function createUser(user: NewUser) {
  const [result] = await db.insert(users).values(user).onConflictDoNothing().returning();
  return result;
}
export function getUser(email: string): Promise<typeof users.$inferSelect | undefined>;
export function getUser(id: string, by: "id"): Promise<typeof users.$inferSelect | undefined>;

export async function getUser(value: string, by?: "id") {
  if (by === "id") {
    const [result] = await db.select().from(users).where(eq(users.id, value));
    return result;
  }

  const [result] = await db.select().from(users).where(eq(users.email, value));
  return result;
}

export async function updateUser(userId: string, updates: { email: string; hashed_password: string }) {
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
export async function setUserChirpyRed(userId: string) {
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
