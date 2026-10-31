import { Router } from "express";
import { groupController } from "../controllers/groups.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: API endpoints for managing groups
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
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
 * /groups:
 *   get:
 *     summary: Get the caller's groups with contribution totals (admins see all groups)
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: Groups and contribution summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSavings:
 *                           type: number
 *                         contributionsCount:
 *                           type: integer
 *                     groups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           memberCount:
 *                             type: integer
 *                           cycleMonths:
 *                             type: integer
 *                           monthlyContribution:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [BIDDING, OPEN, CLOSED]
 *                           nextBid:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               round:
 *                                 type: integer
 *                               at:
 *                                 type: string
 *                                 format: date-time
 *                           role:
 *                             type: string
 *                             enum: [owner, member]
 */
router.get("/", groupController.getAll);

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Get group by ID
 *     tags: [Groups]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       404:
 *         description: Group not found
 */
router.get("/:id", groupController.getById);

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Group'
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 */
router.post("/", groupController.create);

/**
 * @swagger
 * /groups/{id}:
 *   put:
 *     summary: Update a group
 *     tags: [Groups]
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
 *             $ref: '#/components/schemas/Group'
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       404:
 *         description: Group not found
 */
router.put("/:id", groupController.update);

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Delete a group
 *     tags: [Groups]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       404:
 *         description: Group not found
 */
router.delete("/:id", groupController.remove);

export default router;