// prisma/seedUsers.ts
// Default phone-login accounts for local development. Phone numbers are stored in E.164 form so they
// match the lookup done at login. Login only succeeds for numbers that exist in the User table.
import type { PrismaClient } from "@prisma/client";

export const SEED_ADMIN_PHONE = "+911234567890";
export const SEED_MEMBER_PHONE = "+911234567891";
export const SEED_SUPER_ADMIN_PHONE = "+911234567892";

export type SeedRole = "admin" | "user";

export interface SeedPhoneUser {
    phone: string;
    name: string;
    role: SeedRole;
}

export const DEFAULT_PHONE_USERS: readonly SeedPhoneUser[] = [
    { phone: SEED_ADMIN_PHONE, name: "Admin User", role: "admin" },
    { phone: SEED_MEMBER_PHONE, name: "Member User", role: "user" },
];

/** Create or update the default phone users. Safe to run more than once. */
export async function seedDefaultPhoneUsers(
    prisma: Pick<PrismaClient, "user">,
    roleIds: Record<SeedRole, string>,
): Promise<void> {
    for (const seedUser of DEFAULT_PHONE_USERS) {
        const roleId = roleIds[seedUser.role];
        await prisma.user.upsert({
            where: { phone: seedUser.phone },
            update: { name: seedUser.name, phoneVerified: true, roleId },
            create: {
                name: seedUser.name,
                phone: seedUser.phone,
                phoneVerified: true,
                roleId,
            },
        });
    }
}
