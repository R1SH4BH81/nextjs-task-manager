import { sign, verify, SignOptions, Secret } from "jsonwebtoken";
import { config } from "../config";

type AccessPayload = { userId: number; tokenVersion: number };
type RefreshPayload = { userId: number; tokenVersion: number };

export function signAccessToken(payload: AccessPayload) {
  return sign(payload, config.accessTokenSecret as Secret, { expiresIn: config.accessTokenExpires } as any);
}

export function signRefreshToken(payload: RefreshPayload) {
  return sign(payload, config.refreshTokenSecret as Secret, { expiresIn: config.refreshTokenExpires } as any);
}

export function verifyAccessToken(token: string) {
  return verify(token, config.accessTokenSecret as Secret) as AccessPayload;
}

export function verifyRefreshToken(token: string) {
  return verify(token, config.refreshTokenSecret as Secret) as RefreshPayload;
}
