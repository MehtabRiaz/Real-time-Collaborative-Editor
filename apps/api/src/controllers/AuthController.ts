import {registerBodySchema, loginBodySchema} from "../schemas/index.js";
import type { Request, Response } from "express";
import {hashPassword, signJwtToken, setRefreshCookie, verifyPassword, clearRefreshCookie, getRefreshTokenFromRequest, verifyJwtToken} from "../utils/auth.js";
import { User } from "../models/User.js";
import { Profile } from "../models/Profile.js";
import mongoose from "mongoose";

export const register = async (req: Request, res: Response) => {
    const parsed = registerBodySchema.safeParse(req.body);
    if(!parsed.success) {
        console.error('Invalid request body', parsed.error);
        return res.status(400).json({ error: 'Invalid request body' });
    }
    const { email, password, firstName, lastName, username } = parsed.data;


    try {

        const existingUser = await User.findOne({email});
        if(existingUser) {
            console.error('User already exists', email);
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);
        const session = await mongoose.startSession();
        let profile = null;

        try {
            await session.withTransaction(async () => {
                const [user] = await User.create([{email, password: hashedPassword}], {session});
                [profile] = await Profile.create([{firstName, lastName, username, userId: user._id}], {session});
            })
        }
        finally {
            await session.endSession();
        }

        res.status(200).json({profile});
    } catch (error) {
        console.error('Error registering user', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const login = async (req: Request, res: Response) => {
    const parsed = loginBodySchema.safeParse(req.body);
    if(!parsed.success) {
        console.error('Invalid request body', parsed.error);    
        return res.status(400).json({ error: 'Invalid request body' });
    }
    const { email, password } = parsed.data;

    try {
        const user = await User.findOne({email}).select("+password");
        if(!user) {
            console.error('User not found', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isPasswordValid = await verifyPassword(password, user.password);
        if(!isPasswordValid) {
            console.error('Invalid password', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const profile = await Profile.findOne({userId: user._id});
        const params = {sub: user._id.toString(), email: user.email, profileId: profile?._id.toString()};
        const accessToken = signJwtToken(params, "access", "15m");
        const refreshToken = signJwtToken(params, "refresh", "7d");
        setRefreshCookie(res, refreshToken);
        res.status(200).json({accessToken,profile});
    } catch (error) {
        console.error('Error logging in', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const logout = async (_req: Request, res: Response) => {
    clearRefreshCookie(res);
    res.status(200).json({ message: "Logged out successfully" });
};

export const me = async (req: Request, res: Response) => {
    const { sub } = req.user!;
    try {
        const profile = await Profile.findOne({ userId: sub }).lean();
        return res.status(200).json({profile});
    } catch (error) {
        console.error("Error fetching current user", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const token = getRefreshTokenFromRequest(req);
        if(!token) {
            return res.status(401).json({error: "Unauthorized"});
        }
        const payload = verifyJwtToken(token, "refresh");
        const accessToken = signJwtToken({sub: payload.sub, email: payload.email, profileId: payload.profileId}, "access", "15m");
        const refreshToken = signJwtToken({sub: payload.sub, email: payload.email, profileId: payload.profileId}, "refresh", "7d");
        setRefreshCookie(res, refreshToken);
        res.status(200).json({ accessToken });
    } catch (error) {
        console.error("Error refreshing token", error);
        clearRefreshCookie(res);
        return res.status(401).json({ error: "Unauthorized" });
    }
};