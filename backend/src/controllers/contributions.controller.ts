// src/controllers/contributions.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { contributionService } from "../services/contribution.service";

export const contributionController = {
  async list(req: AuthRequest, res: Response) {
    const data = await contributionService.listDues(
      { userId: req.user.userId, role: req.user.role },
      req.query.groupId,
      req.query.status,
    );
    res.json({ success: true, data });
  },

  async generate(req: AuthRequest, res: Response) {
    const data = await contributionService.generateDues(
      { userId: req.user.userId, role: req.user.role },
      req.body ?? {},
    );
    res.status(201).json({ success: true, data });
  },

  async markPaid(req: AuthRequest, res: Response) {
    const data = await contributionService.markPaid(
      { userId: req.user.userId, role: req.user.role },
      req.params.id,
      req.body?.method,
    );
    res.json({ success: true, data });
  },
};
