import { Router } from "express";
import { superAdminController as c } from "../controllers/superAdmin.controller";

// Mounted in routes/index.ts behind authMiddleware and requireSuperAdmin, so every route here needs a Super Admin.
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Super Admin
 *   description: Master data for Super Admins only. Any other role gets 403.
 */

/**
 * @swagger
 * /super-admin/users:
 *   get:
 *     summary: List users with their roles
 *     tags: [Super Admin]
 *     responses:
 *       200:
 *         description: Up to 200 users, newest first
 *   post:
 *     summary: Create a user with a phone number and a role
 *     tags: [Super Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, roleId]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, nullable: true }
 *               phone: { type: string, example: "+919876543210" }
 *               roleId: { type: string, format: uuid }
 *               password: { type: string, description: Optional. Needed only for email sign-in. }
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Invalid input, unknown role, or malformed phone number
 *       409:
 *         description: Phone or email already in use
 */
router.get("/users", c.users.list);
router.post("/users", c.users.create);

/**
 * @swagger
 * /super-admin/users/{id}:
 *   get:
 *     summary: Get one user
 *     tags: [Super Admin]
 *     responses:
 *       200: { description: The user }
 *       404: { description: User not found }
 *   put:
 *     summary: Update a user, including reassigning the role
 *     tags: [Super Admin]
 *     responses:
 *       200: { description: Updated user }
 *   delete:
 *     summary: Delete a user. Refused while the user has group, payment, or other linked records.
 *     tags: [Super Admin]
 *     responses:
 *       204: { description: Deleted }
 *       400: { description: You cannot delete your own account }
 *       409: { description: The user has linked records }
 */
router.get("/users/:id", c.users.get);
router.put("/users/:id", c.users.update);
router.delete("/users/:id", c.users.remove);

/**
 * @swagger
 * /super-admin/roles:
 *   get:
 *     summary: List roles with user and permission counts
 *     tags: [Super Admin]
 *   post:
 *     summary: Create a role
 *     tags: [Super Admin]
 *     responses:
 *       201: { description: Role created }
 *       409: { description: Role name already exists }
 */
router.get("/roles", c.roles.list);
router.post("/roles", c.roles.create);

/**
 * @swagger
 * /super-admin/roles/{id}:
 *   get:
 *     summary: Get a role with its permissions
 *     tags: [Super Admin]
 *   put:
 *     summary: Update a role's name or description
 *     tags: [Super Admin]
 *   delete:
 *     summary: Delete a role. Refused while users still hold it. Its permission links are removed.
 *     tags: [Super Admin]
 *     responses:
 *       409: { description: The role still has users }
 */
router.get("/roles/:id", c.roles.get);
router.put("/roles/:id", c.roles.update);
router.delete("/roles/:id", c.roles.remove);

/**
 * @swagger
 * /super-admin/permissions:
 *   get:
 *     summary: List permissions
 *     tags: [Super Admin]
 *   post:
 *     summary: Create a permission
 *     tags: [Super Admin]
 */
router.get("/permissions", c.permissions.list);
router.post("/permissions", c.permissions.create);

/**
 * @swagger
 * /super-admin/permissions/{id}:
 *   get:
 *     summary: Get a permission
 *     tags: [Super Admin]
 *   put:
 *     summary: Update a permission
 *     tags: [Super Admin]
 *   delete:
 *     summary: Delete a permission and its links to roles
 *     tags: [Super Admin]
 */
router.get("/permissions/:id", c.permissions.get);
router.put("/permissions/:id", c.permissions.update);
router.delete("/permissions/:id", c.permissions.remove);

/**
 * @swagger
 * /super-admin/role-permissions:
 *   get:
 *     summary: List role-permission links, optionally for one role (?roleId=)
 *     tags: [Super Admin]
 *   post:
 *     summary: Give a role a permission
 *     tags: [Super Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId, permissionId]
 *             properties:
 *               roleId: { type: string, format: uuid }
 *               permissionId: { type: string, format: uuid }
 *     responses:
 *       201: { description: Link created }
 *       409: { description: Already assigned }
 */
router.get("/role-permissions", c.rolePermissions.list);
router.post("/role-permissions", c.rolePermissions.assign);

/**
 * @swagger
 * /super-admin/role-permissions/{id}:
 *   delete:
 *     summary: Take a permission away from a role (revoke by link id)
 *     tags: [Super Admin]
 *     responses:
 *       204: { description: Revoked }
 */
router.delete("/role-permissions/:id", c.rolePermissions.revoke);

/**
 * @swagger
 * /super-admin/groups:
 *   get:
 *     summary: List every group with member and round counts
 *     tags: [Super Admin]
 *   post:
 *     summary: Create a group
 *     tags: [Super Admin]
 */
router.get("/groups", c.groups.list);
router.post("/groups", c.groups.create);

/**
 * @swagger
 * /super-admin/groups/{id}:
 *   get:
 *     summary: Get a group
 *     tags: [Super Admin]
 *   put:
 *     summary: Update a group
 *     tags: [Super Admin]
 *   delete:
 *     summary: Delete a group with its memberships, messages, and rounds. Refused when dues or payments are recorded.
 *     tags: [Super Admin]
 *     responses:
 *       409: { description: The group has dues or payments recorded }
 */
router.get("/groups/:id", c.groups.get);
router.put("/groups/:id", c.groups.update);
router.delete("/groups/:id", c.groups.remove);

/**
 * @swagger
 * /super-admin/bishis:
 *   get:
 *     summary: List every bishi (round) across groups
 *     tags: [Super Admin]
 *   post:
 *     summary: Create a bishi in a group, owned by a user
 *     tags: [Super Admin]
 */
router.get("/bishis", c.bishis.list);
router.post("/bishis", c.bishis.create);

/**
 * @swagger
 * /super-admin/bishis/{id}:
 *   get:
 *     summary: Get a bishi
 *     tags: [Super Admin]
 *   put:
 *     summary: Update a bishi's title or description
 *     tags: [Super Admin]
 *   delete:
 *     summary: Delete a bishi and its transactions
 *     tags: [Super Admin]
 */
router.get("/bishis/:id", c.bishis.get);
router.put("/bishis/:id", c.bishis.update);
router.delete("/bishis/:id", c.bishis.remove);

/**
 * @swagger
 * /super-admin/transactions:
 *   get:
 *     summary: Read-only list of transactions across all groups (newest first, up to 200)
 *     tags: [Super Admin]
 */
router.get("/transactions", c.transactions.list);

/**
 * @swagger
 * /super-admin/audit-logs:
 *   get:
 *     summary: Read-only audit trail of every change (newest first, up to 200)
 *     tags: [Super Admin]
 */
router.get("/audit-logs", c.auditLogs.list);

export default router;
