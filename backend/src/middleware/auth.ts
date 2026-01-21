import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens";
import { prisma } from "../prisma";

export type AuthedRequest = Request & { user?: { id: number; tokenVersion: number } };

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyAccessToken(parts[1]);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.user = { id: user.id, tokenVersion: user.tokenVersion };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

