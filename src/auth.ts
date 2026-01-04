import jwt, { type JwtPayload } from "jsonwebtoken";
import argon2 from "argon2";
import { type Request } from "express";
import crypto from "crypto";
import { UnauthorizedError } from "./middleware/error.js";

type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;
export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export function checkPasswordHash(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
  const iat = Math.floor(Date.now() / 1000);

  const payload: Payload = {
    iss: "chirpy",
    sub: userID,
    iat,
    exp: iat + expiresIn,
  };

  return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(tokenString, secret) as JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired JWT");
  }

  if (typeof decoded.sub !== "string") {
    throw new UnauthorizedError("JWT subject missing or invalid");
  }

  return decoded.sub;
}

export function getBearerToken(req: Request): string {
  const authorization = req.get("Authorization");
  if (!authorization) {
    throw new UnauthorizedError("Invalid api key");
  }
  const jwt = authorization.replace("Bearer ", "");
  return jwt;
}
export function getAPIKey(req: Request): string {
  const authorization = req.get("Authorization");
  if (!authorization) {
    throw new UnauthorizedError("Invalid api key");
  }
  const jwt = authorization.replace("ApiKey ", "");
  return jwt;
}

export function makeRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
