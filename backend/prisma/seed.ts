import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

    console.log("Seed completed. Admin user: admin@admin.com");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
