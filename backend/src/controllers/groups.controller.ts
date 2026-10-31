import { Request, Response } from "express";
import { groupService } from "../services/group.service";
import { parseGroupStatus } from "../services/group.mapper";
import { AuthRequest } from "../middlewares/auth";
import { notFound } from "../utils/httpError";
import { optionalNumber, optionalString, requireString } from "../utils/validation";

// Optional scheduling fields shared by create and update.
function readGroupFields(body: Record<string, unknown>) {
    return {
        cycleMonths: optionalNumber(body.cycleMonths, "cycleMonths"),
        monthlyContribution: optionalNumber(body.monthlyContribution, "monthlyContribution"),
        status: body.status === undefined ? undefined : parseGroupStatus(body.status),
    };
}

export const groupController = {
    async getAll(req: AuthRequest, res: Response) {
        const result = await groupService.getForUser(req.user.userId, req.user.role === "admin");
        res.json({ success: true, data: result });
    },

    async getById(req: Request, res: Response) {
        const group = await groupService.getById(req.params.id);
        if (!group) throw notFound("Group not found");
        res.json(group);
    },

    async create(req: Request, res: Response) {
        const body = req.body ?? {};
        const group = await groupService.create({
            name: requireString(body.name, "name"),
            ...readGroupFields(body),
        });
        res.status(201).json(group);
    },

    async update(req: Request, res: Response) {
        const body = req.body ?? {};
        const group = await groupService.update(req.params.id, {
            name: optionalString(body.name, "name"),
            ...readGroupFields(body),
        });
        res.json(group);
    },

    async remove(req: Request, res: Response) {
        await groupService.remove(req.params.id);
        res.json({ message: "Group deleted" });
    }
};
