// src/utils/phone.ts
import { badRequest } from "./httpError";

// Indian mobile numbers: 10 digits, starting with 6-9. Accepts "9876543210" or "+919876543210".
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/**
 * Normalise a phone number to E.164 (+91XXXXXXXXXX).
 * Spaces and hyphens are ignored. Anything else throws a 400.
 */
export function normalizePhone(value: unknown): string {
    if (typeof value !== "string") throw badRequest("phone is required");

    const digits = value.replace(/[\s-]/g, "");
    const national = digits.startsWith("+91") ? digits.slice(3) : digits;

    if (!INDIAN_MOBILE.test(national)) {
        throw badRequest("phone must be a valid 10-digit Indian mobile number");
    }
    return `+91${national}`;
}
