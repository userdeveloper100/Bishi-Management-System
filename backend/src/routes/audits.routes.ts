import { Router } from "express";
import { auditController } from "../controllers/audit.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Audits
 *   description: API endpoints for managing audit logs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Audit:
 *       type: object
 *       required:
 *         - id
 *         - action
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         action:
 *           type: string
 *         details:
 *           type: string
 *         user_id:
 *           type: string
 *           format: uuid
 *           nullable: true
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
 * /audits:
 *   get:
 *     summary: Get all audit logs
 *     tags: [Audits]
 *     responses:
 *       200:
 *         description: List of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Audit'
 */
router.get("/", auditController.getAll);

/**
 * @swagger
 * /audits/{id}:
 *   get:
 *     summary: Get audit record by ID
 *     tags: [Audits]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Audit details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Audit'
 *       404:
 *         description: Audit record not found
 */
router.get("/:id", auditController.getById);

/**
 * @swagger
 * /audits:
 *   post:
 *     summary: Create an audit log entry
 *     tags: [Audits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Audit'
 *     responses:
 *       201:
 *         description: Audit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Audit'
 */
router.post("/", auditController.create);

/**
 * @swagger
 * /audits/{id}:
 *   put:
 *     summary: Update an audit log entry
 *     tags: [Audits]
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
 *             $ref: '#/components/schemas/Audit'
 *     responses:
 *       200:
 *         description: Audit updated successfully
 *       404:
 *         description: Audit record not found
 */
router.put("/:id", auditController.update);

/**
 * @swagger
 * /audits/{id}:
 *   delete:
 *     summary: Delete an audit log entry
 *     tags: [Audits]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Audit deleted successfully
 *       404:
 *         description: Audit record not found
 */
router.delete("/:id", auditController.remove);

export default router;