import type { NextFunction, Request, Response } from "express";

export async function middlewareLogResponses(req: Request, res: Response, next: NextFunction) {
  res.on("finish", () => {
    if (res.statusCode != 200 && res.statusCode != 301 && res.statusCode != 304) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
    }
  });
  next();
}
