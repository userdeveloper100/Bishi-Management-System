// src/controllers/superAdmin.controller.ts
import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import {
  superAdminBishis,
  superAdminGroups,
  superAdminPermissions,
  superAdminRolePermissions,
  superAdminRoles,
  superAdminUsers,
  superAdminViews,
} from "../services/superAdmin.service";

/** Every handler runs after requireSuperAdmin, so req.user is a Super Admin here. */
const actor = (req: AuthRequest): string => req.user.userId;
const body = (req: AuthRequest): Record<string, unknown> => req.body ?? {};

/** Wraps a handler so a rejected promise reaches the error handler. */
const handle =
  (fn: (req: AuthRequest, res: Response) => Promise<unknown>, status = 200) =>
  (req: AuthRequest, res: Response, next: NextFunction) =>
    fn(req, res)
      .then((data) => {
        if (data === undefined) return res.status(204).end();
        return res.status(status).json(data);
      })
      .catch(next);

export const superAdminController = {
  users: {
    list: handle(async () => superAdminUsers.list()),
    get: handle(async (req) => superAdminUsers.get(req.params.id)),
    create: handle(async (req) => superAdminUsers.create(actor(req), body(req)), 201),
    update: handle(async (req) => superAdminUsers.update(actor(req), req.params.id, body(req))),
    remove: handle(async (req) => superAdminUsers.remove(actor(req), req.params.id)),
  },

  roles: {
    list: handle(async () => superAdminRoles.list()),
    get: handle(async (req) => superAdminRoles.get(req.params.id)),
    create: handle(async (req) => superAdminRoles.create(actor(req), body(req)), 201),
    update: handle(async (req) => superAdminRoles.update(actor(req), req.params.id, body(req))),
    remove: handle(async (req) => superAdminRoles.remove(actor(req), req.params.id)),
  },

  permissions: {
    list: handle(async () => superAdminPermissions.list()),
    get: handle(async (req) => superAdminPermissions.get(req.params.id)),
    create: handle(async (req) => superAdminPermissions.create(actor(req), body(req)), 201),
    update: handle(async (req) => superAdminPermissions.update(actor(req), req.params.id, body(req))),
    remove: handle(async (req) => superAdminPermissions.remove(actor(req), req.params.id)),
  },

  rolePermissions: {
    list: handle(async (req) => superAdminRolePermissions.list(req.query.roleId as string | undefined)),
    assign: handle(async (req) => superAdminRolePermissions.assign(actor(req), body(req)), 201),
    revoke: handle(async (req) => superAdminRolePermissions.revoke(actor(req), req.params.id)),
  },

  groups: {
    list: handle(async () => superAdminGroups.list()),
    get: handle(async (req) => superAdminGroups.get(req.params.id)),
    create: handle(async (req) => superAdminGroups.create(actor(req), body(req)), 201),
    update: handle(async (req) => superAdminGroups.update(actor(req), req.params.id, body(req))),
    remove: handle(async (req) => superAdminGroups.remove(actor(req), req.params.id)),
  },

  bishis: {
    list: handle(async () => superAdminBishis.list()),
    get: handle(async (req) => superAdminBishis.get(req.params.id)),
    create: handle(async (req) => superAdminBishis.create(actor(req), body(req)), 201),
    update: handle(async (req) => superAdminBishis.update(actor(req), req.params.id, body(req))),
    remove: handle(async (req) => superAdminBishis.remove(actor(req), req.params.id)),
  },

  transactions: {
    list: handle(async () => superAdminViews.transactions()),
  },

  auditLogs: {
    list: handle(async () => superAdminViews.auditLogs()),
  },
};
