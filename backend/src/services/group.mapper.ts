// src/services/group.mapper.ts
// Pure functions that turn database rows into the group shape the frontend expects.
import { badRequest } from "../utils/httpError";

export const GROUP_STATUSES = ["BIDDING", "OPEN", "CLOSED"] as const;
export type GroupStatus = (typeof GROUP_STATUSES)[number];

export interface GroupRow {
  id: string;
  name: string;
  cycleMonths: number;
  monthlyContribution: number;
  status: string;
  nextBidRound: number | null;
  nextBidAt: Date | null;
  membership: { userId: string; role: string | null; status: string | null }[];
  bishis: { ownerId: string }[];
}

export interface GroupSummary {
  id: string;
  name: string;
  memberCount: number;
  cycleMonths: number;
  monthlyContribution: number;
  status: GroupStatus;
  nextBid: { round: number; at: string } | null;
  role: "owner" | "member";
}

/** Validate a status sent by a client. Throws 400 for anything outside GROUP_STATUSES. */
export function parseGroupStatus(value: unknown): GroupStatus {
  if (
    typeof value === "string" &&
    (GROUP_STATUSES as readonly string[]).includes(value)
  ) {
    return value as GroupStatus;
  }
  throw badRequest(`status must be one of ${GROUP_STATUSES.join(", ")}`);
}

/** Read a stored status. Unknown values fall back to OPEN rather than leaking raw data. */
export function toGroupStatus(value: string): GroupStatus {
  return (GROUP_STATUSES as readonly string[]).includes(value)
    ? (value as GroupStatus)
    : "OPEN";
}

/** Members are memberships that have been accepted; pending invitations are not counted. */
export function countMembers(memberships: GroupRow["membership"]): number {
  return memberships.filter((m) => m.status === "accepted").length;
}

/** "owner" if the user holds an owner membership or owns a bishi in the group; otherwise "member". */
export function toGroupRole(
  group: GroupRow,
  userId: string,
): "owner" | "member" {
  const isOwnerMembership = group.membership.some(
    (m) => m.userId === userId && m.role === "owner",
  );
  const ownsBishi = group.bishis.some((b) => b.ownerId === userId);
  return isOwnerMembership || ownsBishi ? "owner" : "member";
}

export function toNextBid(
  group: Pick<GroupRow, "nextBidRound" | "nextBidAt">,
): GroupSummary["nextBid"] {
  if (group.nextBidRound == null || group.nextBidAt == null) return null;
  return { round: group.nextBidRound, at: group.nextBidAt.toISOString() };
}

export function toGroupSummary(group: GroupRow, userId: string): GroupSummary {
  return {
    id: group.id,
    name: group.name,
    memberCount: countMembers(group.membership),
    cycleMonths: group.cycleMonths,
    monthlyContribution: group.monthlyContribution,
    status: toGroupStatus(group.status),
    nextBid: toNextBid(group),
    role: toGroupRole(group, userId),
  };
}

export function summariseContributions(
  totalAmount: number | null,
  count: number,
) {
  return { totalSavings: totalAmount ?? 0, contributionsCount: count };
}
