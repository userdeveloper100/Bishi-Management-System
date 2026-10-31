// membership.controller.ts
import { Request, Response } from "express";
import { membershipService } from "../services/membership.service";
import { notFound } from "../utils/httpError";
import { optionalString, requireString } from "../utils/validation";

export const membershipController = {
    // Get all memberships
    async getAll(req: Request, res: Response) {
        res.status(200).json(await membershipService.getAllMemberships());
    },

    // Get a membership by ID
    async getById(req: Request, res: Response) {
        const membership = await membershipService.getMembershipById(req.params.id);
        if (!membership) throw notFound("Membership not found");
        res.status(200).json(membership);
    },

    // Create a new membership
    async create(req: Request, res: Response) {
        const body = req.body ?? {};
        const membership = await membershipService.createMembership({
            userId: requireString(body.userId, "userId"),
            groupId: requireString(body.groupId, "groupId"),
            role: optionalString(body.role, "role"),
            status: optionalString(body.status, "status"),
        });
        res.status(201).json(membership);
    },

    async update(req: Request, res: Response) {
        const body = req.body ?? {};
        const updated = await membershipService.update(req.params.id, {
            role: optionalString(body.role, "role"),
            status: optionalString(body.status, "status"),
        });
        res.json(updated);
    },

    // Delete a membership
    async remove(req: Request, res: Response) {
        await membershipService.remove(req.params.id);
        res.status(200).json({ message: "Membership deleted" });
    },
};
