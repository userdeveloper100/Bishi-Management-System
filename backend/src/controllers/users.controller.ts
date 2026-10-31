import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { notFound } from "../utils/httpError";
import {
  optionalString,
  requireEmail,
  requireString,
} from "../utils/validation";

export const userController = {
  async getAll(req: Request, res: Response) {
    res.json(await userService.getAll());
  },

  async getById(req: Request, res: Response) {
    const user = await userService.getById(req.params.id);
    if (!user) throw notFound("User not found");
    res.json(user);
  },

  async create(req: Request, res: Response) {
    const body = req.body ?? {};
    const user = await userService.create({
      name: requireString(body.name, "name"),
      email: requireEmail(body.email, "email"),
      password: requireString(body.password, "password"),
      roleId: optionalString(body.roleId, "roleId"),
    });
    res.status(201).json(user);
  },

  async update(req: Request, res: Response) {
    const body = req.body ?? {};
    const user = await userService.update(req.params.id, {
      name: optionalString(body.name, "name"),
      email:
        body.email === undefined
          ? undefined
          : requireEmail(body.email, "email"),
      password: optionalString(body.password, "password"),
      roleId: optionalString(body.roleId, "roleId"),
    });
    res.json(user);
  },

  async remove(req: Request, res: Response) {
    await userService.remove(req.params.id);
    res.json({ message: "User deleted" });
  },
};
