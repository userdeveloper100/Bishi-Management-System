import { Router } from "express";
import { membershipController } from "../controllers/membership.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Memberships
 *   description: API endpoints for managing memberships
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Membership:
 *       type: object
 *       required:
 *         - id
 *         - user_id
 *         - group_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         group_id:
 *           type: string
 *           format: uuid
 *         role:
 *           type: string
 *           example: "member"
 *         status:
 *           type: string
 *           example: "active"
 *         created_by:
 *           type: string
 *           nullable: true
 *         created_date:
 *           type: string
 *           format: date-time
 *         modified_by:
 *           type: string
 *           nullable: true
 *         modified_date:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /memberships:
 *   get:
 *     summary: Get all memberships
 *     tags: [Memberships]
 *     responses:
 *       200:
 *         description: List of memberships
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Membership'
 */
router.get("/", membershipController.getAll);

/**
 * @swagger
 * /memberships/{id}:
 *   get:
 *     summary: Get membership by ID
 *     tags: [Memberships]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Membership details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Membership'
 *       404:
 *         description: Membership not found
 */
router.get("/:id", membershipController.getById);

/**
 * @swagger
 * /memberships:
 *   post:
 *     summary: Create a new membership
 *     tags: [Memberships]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Membership'
 *     responses:
 *       201:
 *         description: Membership created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Membership'
 */
router.post("/", membershipController.create);

/**
 * @swagger
 * /memberships/{id}:
 *   put:
 *     summary: Update a membership
 *     tags: [Memberships]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Membership'
 *     responses:
 *       200:
 *         description: Membership updated successfully
 *       404:
 *         description: Membership not found
 */
router.put("/:id", membershipController.update);

/**
 * @swagger
 * /memberships/{id}:
 *   delete:
 *     summary: Delete a membership
 *     tags: [Memberships]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Membership deleted successfully
 *       404:
 *         description: Membership not found
 */
router.delete("/:id", membershipController.remove);

export default router;
