// src/utils/roles.ts
// Role tiers. The role name is stored on User.role (a Role row) and carried in the JWT.
//   super_admin: platform owner. Oversight of every group, and the admin-only user routes.
//   admin:       existing platform role. Keeps its current access to user routes and the group list.
//                Group organizers are admins of their own groups (Membership.role = "admin").
//   user:        member. Sees only the groups they belong to, and their own dues.
export const ROLE = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
} as const;

export const PAYMENT_METHODS = ["CASH", "UPI"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function isSuperAdmin(role: string | undefined): boolean {
  return role === ROLE.SUPER_ADMIN;
}
