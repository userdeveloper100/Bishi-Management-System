import { Router } from "express";
import { bishisController } from "../controllers/bishis.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bishis
 *   description: API endpoints for managing bishis
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Bishi:
 *       type: object
 *       required:
 *         - id
 *         - group_id
 *         - amount
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         group_id:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *         duration_months:
 *           type: integer
 *         start_date:
 *           type: string
 *           format: date-time
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
 * /bishis:
 *   get:
 *     summary: Get all bishis
 *     tags: [Bishis]
 *     responses:
 *       200:
 *         description: List of bishis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bishi'
 */
router.get("/", bishisController.getAll);

/**
 * @swagger
 * /bishis/{id}:
 *   get:
 *     summary: Get bishi by ID
 *     tags: [Bishis]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bishi details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bishi'
 *       404:
 *         description: Bishi not found
 */
router.get("/:id", bishisController.getById);

/**
 * @swagger
 * /bishis:
 *   post:
 *     summary: Create a new bishi
 *     tags: [Bishis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bishi'
 *     responses:
 *       201:
 *         description: Bishi created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bishi'
 */
router.post("/", bishisController.create);

/**
 * @swagger
 * /bishis/{id}:
 *   put:
 *     summary: Update an existing bishi
 *     tags: [Bishis]
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
 *             $ref: '#/components/schemas/Bishi'
 *     responses:
 *       200:
 *         description: Bishi updated successfully
 *       404:
 *         description: Bishi not found
 */
router.put("/:id", bishisController.update);

/**
 * @swagger
 * /bishis/{id}:
 *   delete:
 *     summary: Delete a bishi
 *     tags: [Bishis]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bishi deleted successfully
 *       404:
 *         description: Bishi not found
 */
router.delete("/:id", bishisController.remove);

export default router;
