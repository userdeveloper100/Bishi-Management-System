// src/services/profile.mapper.ts
// Pure functions that build the profile response. Pricing lives here so it is defined in one place.

export const PRO_PLAN = {
    planName: "BhishiPay Pro",
    price: 299,
    currency: "INR",
    period: "3 months",
} as const;

/** Languages the app can display. Keep in step with the frontend locale files. */
export const SUPPORTED_LANGUAGES = ["en", "hi", "mr"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface ProfileRow {
    id: string;
    name: string;
    phone: string | null;
    phoneVerified: boolean;
    email: string | null;
    upiId: string | null;
    language: string;
    proUntil: Date | null;
}

/**
 * Initials for the avatar. Two or more words give the first letter of the first two words;
 * a single word gives its first two letters ("Sp" becomes "SP").
 */
export function toInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

export function isProActive(proUntil: Date | null, now: Date = new Date()): boolean {
    return proUntil !== null && proUntil.getTime() > now.getTime();
}

export function toProfile(row: ProfileRow, now: Date = new Date()) {
    const active = isProActive(row.proUntil, now);
    return {
        id: row.id,
        name: row.name,
        initials: toInitials(row.name),
        phone: row.phone,
        phoneVerified: row.phoneVerified,
        email: row.email,
        upiId: row.upiId,
        language: row.language,
        pro: {
            active,
            planName: active ? PRO_PLAN.planName : null,
            price: active ? PRO_PLAN.price : null,
            currency: PRO_PLAN.currency,
            period: active ? PRO_PLAN.period : null,
        },
    };
}
