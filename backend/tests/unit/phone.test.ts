import { normalizePhone } from "../../src/utils/phone";
import { statusOf } from "../helpers/statusOf";

describe("normalizePhone", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["+919876543210", "+919876543210"],
    ["98765 43210", "+919876543210"],
    ["+91-98765-43210", "+919876543210"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    ["12345"],
    ["5876543210"],
    ["98765432101"],
    ["+14155550123"],
    ["abcdefghij"],
    [""],
  ])("rejects %p with a 400", (input) => {
    expect(statusOf(() => normalizePhone(input))).toBe(400);
  });

  it("rejects non-string input with a 400", () => {
    expect(() => normalizePhone(9876543210)).toThrow("phone is required");
    expect(() => normalizePhone(undefined)).toThrow("phone is required");
  });
});

describe("normalizePhone with the local dummy number", () => {
  const saved = {
    NODE_ENV: process.env.NODE_ENV,
    USE_LOCAL_OTP: process.env.USE_LOCAL_OTP,
  };

  afterEach(() => {
    process.env.NODE_ENV = saved.NODE_ENV;
    if (saved.USE_LOCAL_OTP === undefined) delete process.env.USE_LOCAL_OTP;
    else process.env.USE_LOCAL_OTP = saved.USE_LOCAL_OTP;
  });

  it("accepts +911234567890 in local development", () => {
    process.env.NODE_ENV = "development";
    expect(normalizePhone("+911234567890")).toBe("+911234567890");
    expect(normalizePhone("1234567890")).toBe("+911234567890");
  });

  it("accepts +911234567890 when USE_LOCAL_OTP=true", () => {
    process.env.NODE_ENV = "test";
    process.env.USE_LOCAL_OTP = "true";
    expect(normalizePhone("+911234567890")).toBe("+911234567890");
  });

  it("rejects +911234567890 when local test mode is off", () => {
    process.env.NODE_ENV = "test";
    delete process.env.USE_LOCAL_OTP;
    expect(statusOf(() => normalizePhone("+911234567890"))).toBe(400);
  });

  it("rejects +911234567890 in production even with USE_LOCAL_OTP=true", () => {
    process.env.NODE_ENV = "production";
    process.env.USE_LOCAL_OTP = "true";
    expect(statusOf(() => normalizePhone("+911234567890"))).toBe(400);
  });
});
