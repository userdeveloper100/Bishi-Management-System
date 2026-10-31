import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { prisma } from "../prismaClient";

const JWT_SECRET = process.env.JWT_SECRET!;
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

export const authService = {
    /**
     * Register a new user
     */
    async register(name: string, email: string, password: string, roleName = "user") {
        const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        // 🔑 Find role by name (default "user")
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
            throw new Error(`Role "${roleName}" not found in database`);
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                roleId: role.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                created_date: true,
                role: { select: { name: true } },
            },
        });

        return user;
    },

    /**
     * Login user and return JWT
     */
    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                role: { select: { name: true } },
            },
        });

        if (!user) throw new Error("Invalid email or password");

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new Error("Invalid email or password");

        const roleName = user.role?.name || "user";

        const token = this.generateToken({
            id: user.id,
            role: roleName,
        });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: roleName,
            },
        };
    },

    /**
     * Generate JWT Token
     */
    generateToken(user: { id: string; role: string }) {
        const payload = { userId: user.id, role: user.role };

        const options: SignOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"],
        };

        return jwt.sign(payload, JWT_SECRET as Secret, options);
    }
};
