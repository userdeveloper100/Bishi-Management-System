// src/controllers/message.controller.ts
import { Request, Response } from "express";
import { messageService } from "../services/message.service";
import { notFound } from "../utils/httpError";
import { optionalString, requireString } from "../utils/validation";

export const messageController = {
  async getAll(req: Request, res: Response) {
    res.json(await messageService.getAll());
  },

  async getByGroup(req: Request, res: Response) {
    res.status(200).json(await messageService.getByGroup(req.params.groupId));
  },

  async getById(req: Request, res: Response) {
    const message = await messageService.getById(req.params.id);
    if (!message) throw notFound("Message not found");
    res.status(200).json(message);
  },

  async create(req: Request, res: Response) {
    const body = req.body ?? {};
    const message = await messageService.create({
      content: requireString(body.content, "content"),
      groupId: requireString(body.groupId, "groupId"),
      userId: requireString(body.userId, "userId"),
    });
    res.status(201).json(message);
  },

  async update(req: Request, res: Response) {
    const body = req.body ?? {};
    const updated = await messageService.update(req.params.id, {
      content: optionalString(body.content, "content"),
    });
    res.json(updated);
  },

  async remove(req: Request, res: Response) {
    await messageService.remove(req.params.id);
    res.status(200).json({ message: "Message deleted" });
  },
};
