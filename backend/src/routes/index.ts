import { Router } from "express";

import userRoutes from "./users.routes";
import groupRoutes from "./groups.routes";
import bishiRoutes from "./bishis.routes";
import transactionRoutes from "./transactions.routes";
import messageRoutes from "./messages.routes";
import membershipRoutes from "./memberships.routes";
import notificationRoutes from "./notifications.routes";
import auditRoutes from "./audits.routes";
import authRoutes from "./auth.routes";
import alertRoutes from "./alerts.routes";
import profileRoutes from "./profile.routes";
import contributionRoutes from "./contributions.routes";
import {
  AuthRequest,
  authMiddleware,
  authorizeRoles,
} from "../middlewares/auth";
import { NextFunction, Response } from "express";

const router = Router();

// Deletes on the resource routes are admin-only; other methods only need a valid token.
const adminForDelete = (req: AuthRequest, res: Response, next: NextFunction) =>
  req.method === "DELETE" ? authorizeRoles("admin", "super_admin")(req, res, next) : next();

// Users apply authMiddleware per route (some routes also need the admin role).
// Every other resource requires a valid token.
router.use("/users", userRoutes);
router.use("/groups", authMiddleware, adminForDelete, groupRoutes);
router.use("/bishis", authMiddleware, adminForDelete, bishiRoutes);
router.use("/transactions", authMiddleware, adminForDelete, transactionRoutes);
router.use("/messages", authMiddleware, adminForDelete, messageRoutes);
router.use("/memberships", authMiddleware, adminForDelete, membershipRoutes);
router.use(
  "/notifications",
  authMiddleware,
  adminForDelete,
  notificationRoutes,
);
router.use("/audits", authMiddleware, adminForDelete, auditRoutes);
router.use("/auth", authRoutes);

// Signed-in user's own data. No admin rule: each handler only reads the caller's records.
router.use("/alerts", authMiddleware, alertRoutes);
router.use("/user", authMiddleware, profileRoutes);

// Dues and manual payments. Each handler checks that the caller administers the group.
router.use("/contributions", authMiddleware, contributionRoutes);

export default router;
