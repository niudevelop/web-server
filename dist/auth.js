import jwt, {} from "jsonwebtoken";
import argon2 from "argon2";
import {} from "express";
import crypto from "crypto";
import { UnauthorizedError } from "./middleware/error.js";
export function hashPassword(password) {
    return argon2.hash(password);
}
export function checkPasswordHash(password, hash) {
    return argon2.verify(hash, password);
}
export function makeJWT(userID, expiresIn, secret) {
    const iat = Math.floor(Date.now() / 1000);
    const payload = {
        iss: "chirpy",
        sub: userID,
        iat,
        exp: iat + expiresIn,
    };
    return jwt.sign(payload, secret);
}
export function validateJWT(tokenString, secret) {
    let decoded;
    try {
        decoded = jwt.verify(tokenString, secret);
    }
    catch {
        throw new UnauthorizedError("Invalid or expired JWT");
    }
    if (typeof decoded.sub !== "string") {
        throw new UnauthorizedError("JWT subject missing or invalid");
    }
    return decoded.sub;
}
export function getBearerToken(req) {
    const authorization = req.get("Authorization");
    if (!authorization) {
        throw new UnauthorizedError("Invalid api key");
    }
    const jwt = authorization.replace("Bearer ", "");
    return jwt;
}
export function getAPIKey(req) {
    const authorization = req.get("Authorization");
    if (!authorization) {
        throw new UnauthorizedError("Invalid api key");
    }
    const jwt = authorization.replace("ApiKey ", "");
    return jwt;
}
export function makeRefreshToken() {
    return crypto.randomBytes(32).toString("hex");
}
