import { Request, Response } from "express";
import { groupService } from "../services/group.service";
import { notFound } from "../utils/httpError";
import { optionalString, requireString } from "../utils/validation";

export const groupController = {
    async getAll(req: Request, res: Response) {
        res.json(await groupService.getAll());
    },

    async getById(req: Request, res: Response) {
        const group = await groupService.getById(req.params.id);
        if (!group) throw notFound("Group not found");
        res.json(group);
    },

    async create(req: Request, res: Response) {
        const body = req.body ?? {};
        const group = await groupService.create({ name: requireString(body.name, "name") });
        res.status(201).json(group);
    },

    async update(req: Request, res: Response) {
        const body = req.body ?? {};
        const group = await groupService.update(req.params.id, { name: optionalString(body.name, "name") });
        res.json(group);
    },

    async remove(req: Request, res: Response) {
        await groupService.remove(req.params.id);
        res.json({ message: "Group deleted" });
    }
};
