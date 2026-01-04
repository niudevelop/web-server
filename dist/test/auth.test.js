import { describe, it, expect, beforeAll } from "vitest";
import { checkPasswordHash, hashPassword, makeJWT, validateJWT } from "../auth";
describe("Password Hashing", () => {
    const password1 = "correctPassword123!";
    const password2 = "anotherPassword456!";
    let hash1;
    let hash2;
    beforeAll(async () => {
        hash1 = await hashPassword(password1);
        hash2 = await hashPassword(password2);
    });
    it("should return true for the correct password", async () => {
        const result = await checkPasswordHash(password1, hash1);
        expect(result).toBe(true);
    });
});
describe("JWT creation and verification", () => {
    const userID = "user-123";
    const secret = "super-secret-key";
    const wrongSecret = "wrong-secret-key";
    it("should create and validate a JWT", () => {
        const token = makeJWT(userID, 60, secret);
        const decodedUserID = validateJWT(token, secret);
        expect(decodedUserID).toBe(userID);
    });
    it("should reject an expired JWT", () => {
        const token = makeJWT(userID, -10, secret);
        expect(() => validateJWT(token, secret)).toThrow();
    });
    it("should reject a JWT signed with the wrong secret", () => {
        const token = makeJWT(userID, 60, secret);
        expect(() => validateJWT(token, wrongSecret)).toThrow();
    });
});
