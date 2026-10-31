// src/services/otp.service.ts
import { prisma } from "../prismaClient";
import { getSmsSender } from "./sms.service";
import { HttpError, badRequest } from "../utils/httpError";
import { normalizePhone } from "../utils/phone";
import {
  LOCAL_TEST_OTP,
  LOCAL_TEST_PHONES,
  OTP_LENGTH,
  generateOtp,
  hashOtp,
  isLocalTestOtpEnabled,
  isLocalTestPhone,
  otpMatches,
} from "../utils/otp";

export const OTP_TTL_SECONDS = 5 * 60;
export const RESEND_COOLDOWN_SECONDS = 30;
export const MAX_SENDS_PER_HOUR = 5;
export const MAX_VERIFY_ATTEMPTS = 5;

function hashSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export const otpService = {
  /**
   * Create a new OTP for the phone number and send it by SMS.
   * The plain code is never returned to the caller and never stored.
   */
  async sendOtp(phoneInput: unknown) {
    const phone = normalizePhone(phoneInput);

    // Local dummy login: no SMS and no rate limits. Verify with LOCAL_TEST_OTP.
    if (isLocalTestPhone(phone)) {
      console.log(
        `[otp] LOCAL DUMMY LOGIN: ${phone} uses code ${LOCAL_TEST_OTP}. No SMS sent.`,
      );
      return {
        success: true,
        message: "OTP sent",
        expiresInSeconds: OTP_TTL_SECONDS,
        resendInSeconds: RESEND_COOLDOWN_SECONDS,
      };
    }

    const now = new Date();

    const latest = await prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: "desc" },
    });
    if (
      latest &&
      now.getTime() - latest.createdAt.getTime() <
        RESEND_COOLDOWN_SECONDS * 1000
    ) {
      throw new HttpError(
        429,
        `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before requesting another OTP`,
      );
    }

    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sentRecently = await prisma.otpCode.count({
      where: { phone, createdAt: { gte: hourAgo } },
    });
    if (sentRecently >= MAX_SENDS_PER_HOUR) {
      throw new HttpError(429, "Too many OTP requests. Try again later.");
    }

    const code = generateOtp();
    await prisma.otpCode.create({
      data: {
        phone,
        codeHash: hashOtp(phone, code, hashSecret()),
        expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
      },
    });

    const minutes = OTP_TTL_SECONDS / 60;
    await getSmsSender().send(
      phone,
      `Your BhishiPay code is ${code}. It expires in ${minutes} minutes. Do not share it.`,
    );

    if (isLocalTestOtpEnabled()) {
      console.log(
        `[otp] LOCAL TEST MODE: code ${LOCAL_TEST_OTP} is also accepted for ${phone}`,
      );
    }

    return {
      success: true,
      message: "OTP sent",
      expiresInSeconds: OTP_TTL_SECONDS,
      resendInSeconds: RESEND_COOLDOWN_SECONDS,
    };
  },

  /**
   * Check a code against the latest unused OTP for the phone.
   * A correct code is consumed so it cannot be used twice. Returns the normalised phone.
   */
  async verifyOtp(phoneInput: unknown, otpInput: unknown): Promise<string> {
    const phone = normalizePhone(phoneInput);
    if (
      typeof otpInput !== "string" ||
      !new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otpInput)
    ) {
      throw badRequest(`otp must be a ${OTP_LENGTH}-digit code`);
    }

    // Local development only: the fixed test code works without a stored OTP.
    if (otpInput === LOCAL_TEST_OTP && isLocalTestOtpEnabled()) {
      const label = LOCAL_TEST_PHONES.includes(phone)
        ? "LOCAL DUMMY LOGIN"
        : "LOCAL TEST MODE";
      console.log(`[otp] ${label}: accepted test code for ${phone}`);
      return phone;
    }

    const now = new Date();
    const record = await prisma.otpCode.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!record || record.expiresAt.getTime() <= now.getTime()) {
      throw new HttpError(401, "OTP expired or not found");
    }
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new HttpError(
        429,
        "Too many incorrect attempts. Request a new OTP.",
      );
    }

    if (!otpMatches(phone, otpInput, record.codeHash, hashSecret())) {
      const updated = await prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      if (updated.attempts >= MAX_VERIFY_ATTEMPTS) {
        throw new HttpError(
          429,
          "Too many incorrect attempts. Request a new OTP.",
        );
      }
      throw new HttpError(401, "Invalid OTP");
    }

    await prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: now },
    });
    return phone;
  },
};
