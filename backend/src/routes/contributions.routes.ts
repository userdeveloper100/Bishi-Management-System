import { Router } from "express";
import { contributionController } from "../controllers/contributions.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contributions
 *   description: Monthly dues and manual payment marking (cash or UPI) by group admins
 */

/**
 * @swagger
 * /contributions:
 *   get:
 *     summary: List a group's dues (group admin or Super Admin)
 *     tags: [Contributions]
 *     parameters:
 *       - in: query
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, PAID] }
 *     responses:
 *       200: { description: Dues for the group }
 *       403: { description: Not an admin of this group }
 */
router.get("/", contributionController.list);

/**
 * @swagger
 * /contributions/generate:
 *   post:
 *     summary: Create PENDING dues for every member of a group for one month
 *     tags: [Contributions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [groupId, period, amount]
 *             properties:
 *               groupId: { type: string }
 *               period: { type: string, example: "2026-11" }
 *               amount: { type: number, example: 5000 }
 *     responses:
 *       201: { description: Number of dues created (existing dues are kept) }
 *       403: { description: Not an admin of this group }
 */
router.post("/generate", contributionController.generate);

/**
 * @swagger
 * /contributions/{id}/mark-paid:
 *   post:
 *     summary: Mark a due as paid in cash or by UPI, and record it in the audit log
 *     tags: [Contributions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [method]
 *             properties:
 *               method: { type: string, enum: [CASH, UPI] }
 *     responses:
 *       200: { description: The updated due }
 *       403: { description: Not an admin of this group }
 *       404: { description: Due not found }
 *       409: { description: Already marked as paid }
 */
router.post("/:id/mark-paid", contributionController.markPaid);

export default router;
