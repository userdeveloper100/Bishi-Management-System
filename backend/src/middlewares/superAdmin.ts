// src/middlewares/superAdmin.ts
import { NextFunction, Response } from "express";
import { prisma } from "../prismaClient";
import { AuthRequest } from "./auth";
import { ROLE } from "../utils/roles";

/**
 * Lets a request through only when the signed-in user's role is super_admin.
 * The role is read from the database on every request, not from the token, so a demoted
 * user loses access at once. Run it after authMiddleware.
 */
export async function requireSuperAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (user.role?.name !== ROLE.SUPER_ADMIN) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Super Admin only" });
    }
    next();
  } catch (err) {
    next(err);
  }
}
