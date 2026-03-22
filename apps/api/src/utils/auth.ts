import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { CookieOptions, Request, Response } from "express";
import env from '../config/env.js';

export type JwtPayload = {
    sub: string;
    email: string;
    type: "access" | "refresh";
    iat?: number;
    exp?: number;
};


// PASSWORD UTILS
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

// JWT TOKENS UTILS
export function signJwtToken(
    payload: Pick<JwtPayload, "sub" | "email">,
    type: "access" | "refresh",
    expiresIn: SignOptions["expiresIn"] = "15m"
): string {
    const secret = type === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;
    if(!secret) {
        console.error("JWT secret is not set", { type });
        throw new Error("Server misconfigured");
    }
    return jwt.sign(
        { sub: payload.sub, email: payload.email, type },
        secret,
        { algorithm: "HS256", expiresIn }
    );
}
export function verifyJwtToken(token: string, type: "access" | "refresh"): JwtPayload {
    const secret = type === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;
    if(!secret) {
        console.error("JWT secret is not set", { type });
        throw new Error("Server misconfigured");
    }
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof decoded !== "object" || decoded === null) {
        throw new Error("Invalid token");
    }
    const o = decoded as Record<string, unknown>;
    if (typeof o.sub !== "string" || typeof o.email !== "string" || o.type !== type) {
        throw new Error("Invalid token");
    }
    return decoded as JwtPayload;
} 

// AUTH COOKIE UTILS
export const REFRESH_COOKIE_NAME = "token";
export function getRefreshCookieOptions(isProd: boolean): CookieOptions {
    return {
        httpOnly: true,
        secure: isProd,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: isProd ? "strict" : "lax",
        path: "/",
    }
}
export function getRefreshTokenFromRequest(req: Request): string | undefined {
    const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
    if(typeof tokenFromCookie === "string" && tokenFromCookie.length > 0) return tokenFromCookie;

    return undefined;
}
export function getAccessTokenFromRequest(req: Request): string | undefined {   
    const header = req.headers?.authorization ?? "";
    const tokenFromHeader = /^Bearer\s(.+)$/i.exec(header);
    if(tokenFromHeader && tokenFromHeader.length > 1) return tokenFromHeader[1];

    return undefined;
}
export function setRefreshCookie(res: Response, refreshToken: string) {
    const isProd = env.NODE_ENV === "production";
    const cookieOptions = getRefreshCookieOptions(isProd);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
}
export function clearRefreshCookie(res: Response) {
    const isProd = env.NODE_ENV === "production";
    res.clearCookie(REFRESH_COOKIE_NAME, {
        path: "/",
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "strict" : "lax",
    });
}

//ASSERTIONS UTILS
export function assertAuthSecrets() {
    if(!env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET) {
        console.log('Auth secrets are not defined')
        throw new Error("Server misconfigured");
    }
}