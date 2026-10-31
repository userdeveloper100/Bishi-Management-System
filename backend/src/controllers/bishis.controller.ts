// src/controllers/bishis.controller.ts
import { Request, Response } from "express";
import { bishiService } from "../services/bishi.service";
import { notFound } from "../utils/httpError";
import { optionalString, requireString } from "../utils/validation";

export const bishisController = {
  async getAll(req: Request, res: Response) {
    res.status(200).json(await bishiService.getAll());
  },

  async getById(req: Request, res: Response) {
    const bishi = await bishiService.getById(req.params.id);
    if (!bishi) throw notFound("Bishi not found");
    res.status(200).json(bishi);
  },

  async create(req: Request, res: Response) {
    const body = req.body ?? {};
    const bishi = await bishiService.create({
      title: requireString(body.title, "title"),
      description: optionalString(body.description, "description"),
      groupId: requireString(body.groupId, "groupId"),
      ownerId: requireString(body.ownerId, "ownerId"),
    });
    res.status(201).json(bishi);
  },

  async update(req: Request, res: Response) {
    const body = req.body ?? {};
    const bishi = await bishiService.update(req.params.id, {
      title: optionalString(body.title, "title"),
      description: optionalString(body.description, "description"),
    });
    res.status(200).json(bishi);
  },

  async remove(req: Request, res: Response) {
    await bishiService.remove(req.params.id);
    res.status(200).json({ message: "Bishi deleted" });
  },
};
