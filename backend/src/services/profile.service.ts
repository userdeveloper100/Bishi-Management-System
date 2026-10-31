// src/services/profile.service.ts
import { prisma } from "../prismaClient";
import { badRequest, HttpError } from "../utils/httpError";
import { ProfileRow, SUPPORTED_LANGUAGES, SupportedLanguage, toProfile } from "./profile.mapper";

const PROFILE_SELECT = {
    id: true,
    name: true,
    phone: true,
    phoneVerified: true,
    email: true,
    upiId: true,
    language: true,
    proUntil: true,
} as const;

export const profileService = {
    async getProfile(userId: string) {
        const user = (await prisma.user.findUnique({
            where: { id: userId },
            select: PROFILE_SELECT,
        })) as ProfileRow | null;

        if (!user) throw new HttpError(404, "User not found");
        return toProfile(user);
    },

    /** Save the language the signed-in user chose in Profile settings. */
    async updateLanguage(userId: string, language: unknown) {
        if (typeof language !== "string" || !(SUPPORTED_LANGUAGES as readonly string[]).includes(language)) {
            throw badRequest(`language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`);
        }

        const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!existing) throw new HttpError(404, "User not found");

        const user = (await prisma.user.update({
            where: { id: userId },
            data: { language: language as SupportedLanguage },
            select: PROFILE_SELECT,
        })) as ProfileRow;

        return toProfile(user);
    },
};
