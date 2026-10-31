// src/utils/otp.ts
import { createHmac, randomInt, timingSafeEqual } from "crypto";

export const OTP_LENGTH = 6;

/** Fixed code accepted only in local development. It is never valid in production. */
export const LOCAL_TEST_OTP = "560142";

/**
 * Pre-configured test number. It is not a real mobile number (it starts with 1), so it is accepted
 * only while local test mode is on. In local development it signs in with LOCAL_TEST_OTP and sends no SMS.
 */
export const LOCAL_DUMMY_PHONE = "+911234567890";

/** Seeded member account. Also a local test phone, so it can sign in with LOCAL_TEST_OTP. */
export const LOCAL_MEMBER_PHONE = "+911234567891";

/** Phones that are not real mobile numbers. They may sign in with LOCAL_TEST_OTP in local mode only. */
export const LOCAL_TEST_PHONES: readonly string[] = [
  LOCAL_DUMMY_PHONE,
  LOCAL_MEMBER_PHONE,
];

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

/** True for a local test phone, and only while local test mode is on. */
export function isLocalTestPhone(phone: string): boolean {
  return isLocalTestOtpEnabled() && LOCAL_TEST_PHONES.includes(phone);
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
