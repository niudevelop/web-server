import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

import express from "express";
import type { NextFunction, Request, Response } from "express";
import { middlewareLogResponses } from "./middleware/log.js";
import { middlewareMetricsInc } from "./middleware/metrics.js";
import { config } from "./config.js";
import { BadRequestError, errorHandler, ForbiddenError, NotFoundError, UnauthorizedError } from "./middleware/error.js";
import type { NewChirp, NewUser, User, UserResponse } from "./db/schema.js";
import { createUser, deleteAllUsers, getUser, setUserChirpyRed, updateUser } from "./db/queries/users.js";
import { createChirp, deleteChirp, getChirp, getChirps } from "./db/queries/chirps.js";
import { checkPasswordHash, getAPIKey, getBearerToken, hashPassword, makeJWT, makeRefreshToken, validateJWT } from "./auth.js";
import { createRefreshToken, getUserFromRefreshToken, revokeRefreshToken } from "./db/queries/refreshTokens.js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();
const PORT = 8080;

app.use(express.json());
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(middlewareLogResponses);

app.get("/api/healthz", async (req: Request, res: Response) => {
  res.set("Content-Type", "text/plain");
  res.send("OK");
});

app.get("/admin/metrics", async (req: Request, res: Response) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  const html = `<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>`;
  res.send(html);
});

app.post("/admin/reset", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (config.platform !== "dev") {
      throw new ForbiddenError("Forbidden");
    }
    await deleteAllUsers();
    config.fileserverHits = 0;
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.post("/api/validate_chirp", (req: Request, res: Response, next: NextFunction) => {
  try {
    const bodyText = req.body?.body;
    if (typeof bodyText !== "string") {
      // const errorRes: ResponseError = { error: "Invalid body" };
      throw new BadRequestError("Invalid body");
    }

    if (bodyText.length > 140) {
      throw new BadRequestError("Chirp is too long. Max length is 140");
    }

    const cleanedBody = bodyText.replace(/(kerfuffle|sharbert|fornax)/gi, "****");
    return res.status(200).json({ cleanedBody });
  } catch (err) {
    next(err);
  }
});

app.post("/api/chirps", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      throw new UnauthorizedError();
    }
    const tokenSubUserId = validateJWT(token, config.jwtSecret);
    if (!tokenSubUserId) {
      throw new UnauthorizedError("Invalid Token");
    }
    const newChirp: NewChirp = {
      body: req.body.body,
      userId: tokenSubUserId,
    };
    if (!newChirp.body) {
      throw new BadRequestError("No body found");
    }
    const result = await createChirp(newChirp);
    res.status(201).send(result);
  } catch (err) {
    next(err);
  }
});
app.get("/api/chirps", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getChirps();
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});
app.get("/api/chirps/:chirpID", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chirpID = req.params.chirpID;
    const result = await getChirp(chirpID);
    if (!result) {
      throw new NotFoundError("Chirp not found");
    }
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/chirps/:chirpID", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req);
    if (!token) throw new UnauthorizedError();

    const userId = validateJWT(token, config.jwtSecret);
    if (!userId) throw new UnauthorizedError();

    const chirpID = req.params.chirpID;
    const chirp = await getChirp(chirpID);
    if (!chirp) throw new NotFoundError("Chirp not found");

    if (chirp.userId !== userId) {
      throw new ForbiddenError("Forbidden");
    }

    await deleteChirp(chirpID);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

app.post("/api/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: User = req.body;
    if (!user.email || !user.password) {
      throw new BadRequestError("Email and Password required");
    }
    const hashePassword = await hashPassword(user.password);
    const newUser: NewUser = {
      email: user.email,
      hashed_password: hashePassword,
    };
    const result = await createUser(newUser);
    const { hashed_password, is_chirpy_red, ...response } = result;
    res.status(201).send({ ...response, isChirpyRed: is_chirpy_red });
  } catch (err) {
    next(err);
  }
});
app.put("/api/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req);
    if (!token) throw new UnauthorizedError();

    const userId = validateJWT(token, config.jwtSecret); // throws on invalid/expired
    if (!userId) throw new UnauthorizedError();

    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      throw new BadRequestError("Email and Password required");
    }

    const hashedPassword = await hashPassword(password);

    const updated = await updateUser(userId, {
      email,
      hashed_password: hashedPassword,
    });

    const { hashed_password, is_chirpy_red, ...response } = updated;
    res.status(200).send({ ...response, isChirpyRed: is_chirpy_red });
  } catch (err) {
    next(err);
  }
});

app.post("/api/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: User = req.body;
    if (!user.email || !user.password) {
      throw new BadRequestError("Email and Password required");
    }
    const userDB = await getUser(user.email);
    if (!userDB) {
      throw new NotFoundError("User does not exist");
    }
    const validPassword = await checkPasswordHash(user.password, userDB.hashed_password);
    if (!validPassword) {
      throw new UnauthorizedError();
    }
    // access token: 1 hour
    const accessToken = makeJWT(userDB.id, 3600, config.jwtSecret);

    // refresh token: 60 days stored in DB
    const refreshToken = makeRefreshToken();
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    await createRefreshToken({
      token: refreshToken,
      userId: userDB.id,
      expiresAt,
      revokedAt: null,
    });

    const { hashed_password, is_chirpy_red, ...response } = userDB;
    res.status(200).send({ ...response, isChirpyRed: is_chirpy_red, token: accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

app.post("/api/refresh", async (req, res, next) => {
  try {
    const refreshToken = getBearerToken(req);
    if (!refreshToken) throw new UnauthorizedError();

    const user = await getUserFromRefreshToken(refreshToken);
    if (!user) throw new UnauthorizedError();

    const accessToken = makeJWT(user.id, 3600, config.jwtSecret);
    res.status(200).send({ token: accessToken });
  } catch (err) {
    next(err);
  }
});
app.post("/api/revoke", async (req, res, next) => {
  try {
    const refreshToken = getBearerToken(req);
    if (!refreshToken) throw new UnauthorizedError();

    await revokeRefreshToken(refreshToken);

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

type PolkaWebhook = {
  event: string;
  data: {
    userId: string;
  };
};
app.post("/api/polka/webhooks", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = getAPIKey(req);
    if (apiKey != config.polkaKey) {
      res.sendStatus(401);
      return;
    }
    const eventData: PolkaWebhook = req.body;

    if (eventData.event !== "user.upgraded") {
      res.sendStatus(204);
      return;
    }
    const userDB = await getUser(eventData.data.userId, "id");
    if (!userDB) {
      res.sendStatus(404);
      return;
    }
    await setUserChirpyRed(userDB.id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
