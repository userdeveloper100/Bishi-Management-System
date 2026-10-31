// src/controllers/transactions.controller.ts
import { Request, Response } from "express";
import { transactionService } from "../services/transaction.service";
import { badRequest, notFound } from "../utils/httpError";
import { optionalNumber, requireNumber, requireString } from "../utils/validation";

export const transactionsController = {
    async getAll(req: Request, res: Response) {
        res.status(200).json(await transactionService.getAll());
    },

    async getById(req: Request, res: Response) {
        const transaction = await transactionService.getById(req.params.id);
        if (!transaction) throw notFound("Transaction not found");
        res.status(200).json(transaction);
    },

    async create(req: Request, res: Response) {
        const body = req.body ?? {};
        const amount = requireNumber(body.amount, "amount");
        if (amount <= 0) throw badRequest("amount must be greater than 0");

        const transaction = await transactionService.create({
            amount,
            bishiId: requireString(body.bishiId, "bishiId"),
            userId: requireString(body.userId, "userId"),
        });
        res.status(201).json(transaction);
    },

    async update(req: Request, res: Response) {
        const body = req.body ?? {};
        const updated = await transactionService.update(req.params.id, {
            amount: optionalNumber(body.amount, "amount"),
        });
        res.json(updated);
    },

    async remove(req: Request, res: Response) {
        await transactionService.remove(req.params.id);
        res.status(200).json({ message: "Transaction deleted" });
    },
};
