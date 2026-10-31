import { normalizePhone } from "../../src/utils/phone";
import { statusOf } from "../helpers/statusOf";

describe("normalizePhone", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["+919876543210", "+919876543210"],
    ["98765 43210", "+919876543210"],
    ["+91-98765-43210", "+919876543210"],
    ["1234567890", "+911234567890"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    ["12345"],
    ["0123456789"],
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

  it("gives the same answer whatever the environment, since existence is checked in the database", () => {
    const saved = { NODE_ENV: process.env.NODE_ENV, USE_LOCAL_OTP: process.env.USE_LOCAL_OTP };
    try {
      process.env.NODE_ENV = "production";
      process.env.USE_LOCAL_OTP = "true";
      expect(normalizePhone("1234567891")).toBe("+911234567891");
      process.env.NODE_ENV = "test";
      delete process.env.USE_LOCAL_OTP;
      expect(normalizePhone("1234567891")).toBe("+911234567891");
    } finally {
      process.env.NODE_ENV = saved.NODE_ENV;
      if (saved.USE_LOCAL_OTP === undefined) delete process.env.USE_LOCAL_OTP;
      else process.env.USE_LOCAL_OTP = saved.USE_LOCAL_OTP;
    }
  });
});
