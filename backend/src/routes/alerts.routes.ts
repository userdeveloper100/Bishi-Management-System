import { Response, Router } from "express";
import { AuthRequest } from "../middlewares/auth";
import { alertService } from "../services/alert.service";
import { parseCategory } from "../services/alert.mapper";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Activity feed for the signed-in user
 */

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: Get the caller's activity feed with filter categories
 *     tags: [Alerts]
 *     parameters:
 *       - name: category
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [all, winners, members, rounds]
 *           default: all
 *     responses:
 *       200:
 *         description: Categories with counts, and feed items newest first
 *       400:
 *         description: Unknown category
 *       401:
 *         description: Missing or invalid token
 */
router.get("/", async (req: AuthRequest, res: Response) => {
  const category = parseCategory(req.query.category);
  const data = await alertService.getFeed(req.user.userId, category);
  res.json({ success: true, data });
});

export default router;
