// src/controllers/notifications.controller.ts
import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { notFound } from "../utils/httpError";
import { optionalString, requireString } from "../utils/validation";

export const notificationsController = {
    async getAll(req: Request, res: Response) {
        res.status(200).json(await notificationService.getAll());
    },

    async getById(req: Request, res: Response) {
        const notification = await notificationService.getById(req.params.id);
        if (!notification) throw notFound("Notification not found");
        res.json(notification);
    },

    async getByUser(req: Request, res: Response) {
        res.status(200).json(await notificationService.getByUser(req.params.userId));
    },

    async create(req: Request, res: Response) {
        const body = req.body ?? {};
        const notification = await notificationService.create({
            message: requireString(body.message, "message"),
            userId: requireString(body.userId, "userId"),
        });
        res.status(201).json(notification);
    },

    async update(req: Request, res: Response) {
        const body = req.body ?? {};
        const updated = await notificationService.update(req.params.id, {
            message: optionalString(body.message, "message"),
        });
        res.json(updated);
    },

    async remove(req: Request, res: Response) {
        await notificationService.remove(req.params.id);
        res.status(200).json({ message: "Notification deleted" });
    },
};
