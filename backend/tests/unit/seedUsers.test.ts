import { seedDefaultPhoneUsers, DEFAULT_PHONE_USERS } from "../../prisma/seedUsers";
import { normalizePhone } from "../../src/utils/phone";
import { statusOf } from "../helpers/statusOf";

describe("default phone users", () => {
  it("lists the admin on +911234567890 and the member on +911234567891", () => {
    expect(DEFAULT_PHONE_USERS).toEqual([
      { phone: "+911234567890", name: "Admin User", role: "admin" },
      { phone: "+911234567891", name: "Member User", role: "user" },
    ]);
  });

  it("upserts both users by phone with their role ids and a verified phone", async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = { user: { upsert } } as any;

    await seedDefaultPhoneUsers(prisma, { admin: "role-admin", user: "role-user" });

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenNthCalledWith(1, {
      where: { phone: "+911234567890" },
      update: { name: "Admin User", phoneVerified: true, roleId: "role-admin" },
      create: { name: "Admin User", phone: "+911234567890", phoneVerified: true, roleId: "role-admin" },
    });
    expect(upsert).toHaveBeenNthCalledWith(2, {
      where: { phone: "+911234567891" },
      update: { name: "Member User", phoneVerified: true, roleId: "role-user" },
      create: { name: "Member User", phone: "+911234567891", phoneVerified: true, roleId: "role-user" },
    });
  });
});

describe("local test phones at sign-in", () => {
  const saved = { NODE_ENV: process.env.NODE_ENV, USE_LOCAL_OTP: process.env.USE_LOCAL_OTP };

  afterEach(() => {
    process.env.NODE_ENV = saved.NODE_ENV;
    if (saved.USE_LOCAL_OTP === undefined) delete process.env.USE_LOCAL_OTP;
    else process.env.USE_LOCAL_OTP = saved.USE_LOCAL_OTP;
  });

  it("accepts the seeded member number in local development", () => {
    process.env.NODE_ENV = "development";
    expect(normalizePhone("1234567891")).toBe("+911234567891");
  });

  it("refuses the seeded member number when local test mode is off", () => {
    process.env.NODE_ENV = "test";
    delete process.env.USE_LOCAL_OTP;
    expect(statusOf(() => normalizePhone("+911234567891"))).toBe(400);
  });

  it("refuses the seeded member number in production even with USE_LOCAL_OTP=true", () => {
    process.env.NODE_ENV = "production";
    process.env.USE_LOCAL_OTP = "true";
    expect(statusOf(() => normalizePhone("+911234567891"))).toBe(400);
  });
});
