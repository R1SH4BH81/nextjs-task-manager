import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { loginSchema, registerSchema } from "../validation/schemas";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";

const router = Router();

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const { email, name, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, name, passwordHash } });
  const accessToken = signAccessToken({ userId: user.id, tokenVersion: user.tokenVersion });
  const refreshToken = signRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });
  res.status(201).json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const accessToken = signAccessToken({ userId: user.id, tokenVersion: user.tokenVersion });
  const refreshToken = signRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });
  res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
});

router.post("/refresh", async (req, res) => {
  const token = req.body.refreshToken as string;
  if (!token) {
    res.status(400).json({ error: "Missing refreshToken" });
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const accessToken = signAccessToken({ userId: user.id, tokenVersion: user.tokenVersion });
    const refreshToken = signRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });
    res.json({ accessToken, refreshToken });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

router.post("/logout", async (req, res) => {
  const token = req.body.refreshToken as string | undefined;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await prisma.user.update({
        where: { id: payload.userId },
        data: { tokenVersion: { increment: 1 } }
      });
    } catch {}
  }
  res.json({ success: true });
});

export default router;

