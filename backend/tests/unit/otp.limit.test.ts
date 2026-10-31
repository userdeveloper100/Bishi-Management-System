import { prismaMock } from "../helpers/prismaMock";
import {
  MAX_SENDS_PER_HOUR,
  otpService,
  sendsPerHourLimit,
} from "../../src/services/otp.service";
import { getSmsSender } from "../../src/services/sms.service";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));
jest.mock("../../src/services/sms.service", () => ({
  getSmsSender: jest.fn(),
}));

const PHONE = "+919876543210";
const savedEnv = {
  NODE_ENV: process.env.NODE_ENV,
  OTP_MAX_SENDS_PER_HOUR: process.env.OTP_MAX_SENDS_PER_HOUR,
};

function setEnv(nodeEnv: string | undefined, override: string | undefined) {
  if (nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = nodeEnv;
  if (override === undefined) delete process.env.OTP_MAX_SENDS_PER_HOUR;
  else process.env.OTP_MAX_SENDS_PER_HOUR = override;
}

beforeEach(() => {
  (getSmsSender as jest.Mock).mockReturnValue({ send: jest.fn() });
  prismaMock.user.findUnique.mockResolvedValue({ id: "u1" });
  prismaMock.otpCode.findFirst.mockResolvedValue(null);
  prismaMock.otpCode.create.mockResolvedValue({});
});

afterEach(() => {
  setEnv(savedEnv.NODE_ENV, savedEnv.OTP_MAX_SENDS_PER_HOUR);
});

describe("sendsPerHourLimit", () => {
  it("is 5 in production, and the override is ignored there", () => {
    setEnv("production", "50");
    expect(sendsPerHourLimit()).toBe(MAX_SENDS_PER_HOUR);
  });

  it("has no cap in development unless an override is set", () => {
    setEnv("development", undefined);
    expect(sendsPerHourLimit()).toBeNull();
    setEnv("development", "8");
    expect(sendsPerHourLimit()).toBe(8);
  });

  it("uses 5 outside development when no override is set", () => {
    setEnv("test", undefined);
    expect(sendsPerHourLimit()).toBe(MAX_SENDS_PER_HOUR);
  });

  it("ignores an override that is not a positive whole number", () => {
    for (const bad of ["0", "-3", "2.5", "abc", ""]) {
      setEnv("test", bad);
      expect(sendsPerHourLimit()).toBe(MAX_SENDS_PER_HOUR);
    }
  });
});

describe("otpService.sendOtp hourly cap", () => {
  it("does not count sends in development, so testing is never blocked", async () => {
    setEnv("development", undefined);
    prismaMock.otpCode.count.mockResolvedValue(999);

    await expect(otpService.sendOtp(PHONE)).resolves.toMatchObject({ success: true });
    expect(prismaMock.otpCode.count).not.toHaveBeenCalled();
  });

  it("still enforces the cap in production", async () => {
    setEnv("production", undefined);
    prismaMock.otpCode.count.mockResolvedValue(MAX_SENDS_PER_HOUR);

    await expect(otpService.sendOtp(PHONE)).rejects.toMatchObject({ status: 429 });
    expect(prismaMock.otpCode.create).not.toHaveBeenCalled();
  });

  it("applies the override in development once the override is reached", async () => {
    setEnv("development", "3");
    prismaMock.otpCode.count.mockResolvedValue(3);

    await expect(otpService.sendOtp(PHONE)).rejects.toMatchObject({ status: 429 });
  });

  it("allows a send while below the override", async () => {
    setEnv("development", "3");
    prismaMock.otpCode.count.mockResolvedValue(2);

    await expect(otpService.sendOtp(PHONE)).resolves.toMatchObject({ success: true });
  });
});
