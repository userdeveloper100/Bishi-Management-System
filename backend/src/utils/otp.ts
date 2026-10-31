// src/utils/otp.ts
import { createHmac, randomInt, timingSafeEqual } from "crypto";

export const OTP_LENGTH = 6;

/** Fixed code accepted only in local development. It is never valid in production. */
export const LOCAL_TEST_OTP = "560142";

/**
 * The local test code is active when NODE_ENV=development or USE_LOCAL_OTP=true.
 * It is always off when NODE_ENV=production, even if USE_LOCAL_OTP is set.
 */
export function isLocalTestOtpEnabled(): boolean {
  const nodeEnv = (process.env.NODE_ENV ?? "").trim().toLowerCase();
  if (nodeEnv === "production") return false;
  const useLocalOtp =
    (process.env.USE_LOCAL_OTP ?? "").trim().toLowerCase() === "true";
  return nodeEnv === "development" || useLocalOtp;
}

/** Generate a random numeric code, zero-padded to OTP_LENGTH digits. */
export function generateOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

/**
 * HMAC the code with the server secret and the phone, so stored hashes cannot be
 * reversed to a code and a hash for one phone is not valid for another.
 */
export function hashOtp(phone: string, code: string, secret: string): string {
  return createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

export function otpMatches(
  phone: string,
  code: string,
  codeHash: string,
  secret: string,
): boolean {
  const expected = Buffer.from(hashOtp(phone, code, secret), "hex");
  const actual = Buffer.from(codeHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
