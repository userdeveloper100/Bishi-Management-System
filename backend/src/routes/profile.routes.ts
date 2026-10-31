import { Response, Router } from "express";
import { AuthRequest } from "../middlewares/auth";
import { profileService } from "../services/profile.service";
import { contributionService } from "../services/contribution.service";

const router = Router();

/**
 * @swagger
 * /user/dues:
 *   get:
 *     summary: The signed-in member's own dues, newest period first
 *     tags: [User Profile]
 *     responses:
 *       200:
 *         description: Dues with their group and payment status
 */
router.get("/dues", async (req: AuthRequest, res: Response) => {
  const data = await contributionService.listMyDues(req.user.userId);
  res.json({ success: true, data });
});

/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: The signed-in user's own profile
 */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get the signed-in user's profile, verification status and Pro subscription
 *     tags: [User Profile]
 *     responses:
 *       200:
 *         description: Profile details
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: User not found
 */
router.get("/profile", async (req: AuthRequest, res: Response) => {
  const data = await profileService.getProfile(req.user.userId);
  res.json({ success: true, data });
});

/**
 * @swagger
 * /user/profile:
 *   patch:
 *     summary: Update the signed-in user's language preference
 *     tags: [User Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [language]
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [en, hi, mr, ta, te, kn, bn, pa, gu, mwr]
 *     responses:
 *       200:
 *         description: The updated profile
 *       400:
 *         description: Unsupported language
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: User not found
 */
router.patch("/profile", async (req: AuthRequest, res: Response) => {
  const data = await profileService.updateLanguage(
    req.user.userId,
    req.body?.language,
  );
  res.json({ success: true, data });
});

export default router;
