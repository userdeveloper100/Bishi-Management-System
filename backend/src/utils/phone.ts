// src/utils/phone.ts
import { badRequest } from "./httpError";

// Ten-digit Indian national number, not starting with 0. Accepts "9876543210" or "+919876543210".
// This only checks the shape. Whether the number belongs to an account is decided by the database.
const NATIONAL_NUMBER = /^[1-9]\d{9}$/;

/**
 * Normalise a phone number to E.164 (+91XXXXXXXXXX).
 * Spaces and hyphens are ignored. Anything that is not a ten-digit national number throws a 400.
 */
export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") throw badRequest("phone is required");

  const digits = value.replace(/[\s-]/g, "");
  const national = digits.startsWith("+91") ? digits.slice(3) : digits;
  if (!NATIONAL_NUMBER.test(national)) {
    throw badRequest("phone must be a valid 10-digit Indian mobile number");
  }
  return `+91${national}`;
}
