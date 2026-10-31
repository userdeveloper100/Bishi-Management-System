// src/controllers/audit.controller.ts
import { Request, Response } from "express";
import { auditService } from "../services/audit.service";
import { notFound } from "../utils/httpError";
import { optionalString, requireString } from "../utils/validation";

export const auditController = {
  async getAll(req: Request, res: Response) {
    res.status(200).json(await auditService.getAll());
  },

  async getById(req: Request, res: Response) {
    const audit = await auditService.getById(req.params.id);
    if (!audit) throw notFound("Audit not found");
    res.json(audit);
  },

  async create(req: Request, res: Response) {
    const body = req.body ?? {};
    const log = await auditService.create({
      action: requireString(body.action, "action"),
      entity: requireString(body.entity, "entity"),
      entityId: requireString(body.entityId, "entityId"),
      performedBy: requireString(body.performedBy, "performedBy"),
    });
    res.status(201).json(log);
  },

  async update(req: Request, res: Response) {
    const body = req.body ?? {};
    const updated = await auditService.update(req.params.id, {
      action: optionalString(body.action, "action"),
      entity: optionalString(body.entity, "entity"),
      entityId: optionalString(body.entityId, "entityId"),
      performedBy: optionalString(body.performedBy, "performedBy"),
    });
    res.json(updated);
  },

  async remove(req: Request, res: Response) {
    await auditService.remove(req.params.id);
    res.status(204).send();
  },
};
