import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedDefaultPhoneUsers } from "./seedUsers";

const prisma = new PrismaClient();

async function main(): Promise<void> {
    // Permissions
    const permViewUsers = await prisma.permission.upsert({
        where: { name: "view_users" },
        update: {},
        create: { name: "view_users", description: "Can view users" },
    });

    const permDeleteUsers = await prisma.permission.upsert({
        where: { name: "delete_users" },
        update: {},
        create: { name: "delete_users", description: "Can delete users" },
    });

    // Roles
    const adminRole = await prisma.role.upsert({
        where: { name: "admin" },
        update: {},
        create: { name: "admin", description: "Administrator role" },
    });

    const userRole = await prisma.role.upsert({
        where: { name: "user" },
        update: {},
        create: { name: "user", description: "Regular user" },
    });

    const superAdminRole = await prisma.role.upsert({
        where: { name: "super_admin" },
        update: {},
        create: { name: "super_admin", description: "Platform owner: global oversight, audits and all groups" },
    });

    // Role -> Permission mapping
    await prisma.rolePermission.upsert({
        where: { id: "admin-view" },
        update: {},
        create: {
            id: "admin-view",
            roleId: adminRole.id,
            permissionId: permViewUsers.id,
        },
    });

    await prisma.rolePermission.upsert({
        where: { id: "admin-delete" },
        update: {},
        create: {
            id: "admin-delete",
            roleId: adminRole.id,
            permissionId: permDeleteUsers.id,
        },
    });

    await prisma.rolePermission.upsert({
        where: { id: "user-view" },
        update: {},
        create: {
            id: "user-view",
            roleId: userRole.id,
            permissionId: permViewUsers.id,
        },
    });

    // Super Admin: the same user-management permissions as admin, and it can manage every group.
    for (const perm of [permViewUsers, permDeleteUsers]) {
        await prisma.rolePermission.upsert({
            where: { id: `super-${perm.name}` },
            update: {},
            create: { id: `super-${perm.name}`, roleId: superAdminRole.id, permissionId: perm.id },
        });
    }

    // Default admin user
    // Assumes User has name, email, password, and roleId fields.
    const adminPasswordHash = await bcrypt.hash("admin@123", 10);

    await prisma.user.upsert({
        where: { email: "admin@admin.com" },
        update: {
            name: "Admin User",
            password: adminPasswordHash,
            roleId: adminRole.id,
        },
        create: {
            name: "Admin User",
            email: "admin@admin.com",
            password: adminPasswordHash,
            roleId: adminRole.id,
        },
    });

    // Default phone-login users: admin +911234567890 and member +911234567891 (use OTP 560142 locally).
    await seedDefaultPhoneUsers(prisma, {
        admin: adminRole.id,
        user: userRole.id,
    });

    const superAdminPasswordHash = await bcrypt.hash("superadmin@123", 10);
    await prisma.user.upsert({
        where: { email: "superadmin@admin.com" },
        update: { name: "Super Admin", password: superAdminPasswordHash, roleId: superAdminRole.id },
        create: { name: "Super Admin", email: "superadmin@admin.com", password: superAdminPasswordHash, roleId: superAdminRole.id },
    });

    console.log("Seed completed. Super Admin: superadmin@admin.com (role super_admin)");
    console.log("Admin user: admin@admin.com");
    console.log("Phone users: admin +911234567890, member +911234567891 (local OTP 560142)");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
