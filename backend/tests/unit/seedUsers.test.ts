import {
  seedDefaultPhoneUsers,
  DEFAULT_PHONE_USERS,
  SEED_EMAIL_ADMIN_PHONE,
  SEED_SUPER_ADMIN_PHONE,
} from "../../prisma/seedUsers";
import { normalizePhone } from "../../src/utils/phone";

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

describe("seeded phone numbers", () => {
  it("are valid input, so the seeded accounts can be looked up at sign-in", () => {
    expect(normalizePhone("1234567891")).toBe("+911234567891");
    expect(normalizePhone(SEED_SUPER_ADMIN_PHONE)).toBe("+911234567892");
  });

  it("give every seeded account a valid phone, and no two accounts share one", () => {
    const seeded = [
      ...DEFAULT_PHONE_USERS.map((u) => u.phone),
      SEED_SUPER_ADMIN_PHONE,
      SEED_EMAIL_ADMIN_PHONE,
    ];

    seeded.forEach((phone) => expect(normalizePhone(phone)).toBe(phone));
    expect(new Set(seeded).size).toBe(seeded.length);
  });
});
