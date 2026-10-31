import axios from 'axios';

import { getToken } from './session';

// Android emulators reach the host machine at 10.0.2.2, not localhost.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

const http = axios.create({
  baseURL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---------- Response types (mirror the backend contract) ---------- */

export interface SendOtpResponse {
  success: true;
  message: string;
  expiresInSeconds: number;
  resendInSeconds: number;
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  /** Role name from the database: super_admin, admin, or user. */
  role: string;
  /** Permission names granted to the role, from the database. */
  permissions: string[];
}

export interface VerifyOtpResponse {
  success: true;
  token: string;
  user: AuthUser;
}

export type GroupStatus = 'BIDDING' | 'OPEN' | 'CLOSED';

export interface GroupSummary {
  id: string;
  name: string;
  memberCount: number;
  cycleMonths: number;
  monthlyContribution: number;
  status: GroupStatus;
  nextBid: { round: number; at: string } | null;
  role: 'owner' | 'member';
}

export interface GroupsData {
  summary: { totalSavings: number; contributionsCount: number };
  groups: GroupSummary[];
}

export type AlertCategory = 'all' | 'winners' | 'members' | 'rounds';

export type AlertType = 'ROUND_OPEN' | 'MEMBER_JOINED' | 'WINNER_CONFIRMED' | 'GROUP_CREATED';

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  body: string;
  groupName: string;
  read: boolean;
  createdAt: string;
}

export interface AlertCategoryCount {
  key: AlertCategory;
  label: string;
  count: number;
}

export interface AlertsData {
  categories: AlertCategoryCount[];
  items: AlertItem[];
}

export interface ProfileData {
  id: string;
  name: string;
  initials: string;
  phone: string;
  phoneVerified: boolean;
  email: string | null;
  upiId: string | null;
  language: string;
  pro: {
    active: boolean;
    planName: string | null;
    price: number | null;
    currency: 'INR';
    period: string | null;
  };
}

interface Envelope<T> {
  success: true;
  data: T;
}

/* ---------- Calls ---------- */

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const { data } = await http.post<SendOtpResponse>('/auth/send-otp', { phone });
  return data;
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  const { data } = await http.post<VerifyOtpResponse>('/auth/verify-otp', { phone, otp });
  return data;
}

export async function fetchGroups(): Promise<GroupsData> {
  const { data } = await http.get<Envelope<GroupsData>>('/groups');
  return data.data;
}

export async function fetchAlerts(category: AlertCategory = 'all'): Promise<AlertsData> {
  const { data } = await http.get<Envelope<AlertsData>>('/alerts', { params: { category } });
  return data.data;
}

export async function fetchProfile(): Promise<ProfileData> {
  const { data } = await http.get<Envelope<ProfileData>>('/user/profile');
  return data.data;
}

export interface ProfileUpdate {
  language?: string;
}

export async function updateProfile(patch: ProfileUpdate): Promise<ProfileData> {
  const { data } = await http.patch<Envelope<ProfileData>>('/user/profile', patch);
  return data.data;
}

/* ---------- Dues and manual payments (group admins) ---------- */

export type DueStatus = 'PENDING' | 'PAID';
export type PaymentMethod = 'CASH' | 'UPI';

export interface Due {
  id: string;
  groupId: string;
  userId: string;
  period: string;
  amount: number;
  status: DueStatus;
  method: PaymentMethod | null;
  paidAt: string | null;
  /** Included by the list endpoint only. The mark-paid response leaves it out. */
  user: { id: string; name: string; phone: string | null };
}

export async function fetchDues(groupId: string, status?: DueStatus): Promise<Due[]> {
  const { data } = await http.get<Envelope<Due[]>>('/contributions', { params: { groupId, status } });
  return data.data;
}

export async function generateDues(
  groupId: string,
  period: string,
  amount: number,
): Promise<{ period: string; created: number }> {
  const { data } = await http.post<Envelope<{ period: string; created: number }>>('/contributions/generate', {
    groupId,
    period,
    amount,
  });
  return data.data;
}

export async function markDuePaid(id: string, method: PaymentMethod): Promise<Due> {
  const { data } = await http.post<Envelope<Due>>(`/contributions/${id}/mark-paid`, { method });
  return data.data;
}

/* ---------- Super Admin master settings (raw JSON, no envelope) ---------- */

export type SuperAdminResource =
  | 'users'
  | 'roles'
  | 'permissions'
  | 'role-permissions'
  | 'groups'
  | 'bishis'
  | 'transactions'
  | 'audit-logs';

/** Rows come back as plain objects; each screen reads only the fields it shows. */
export type SuperAdminRow = Record<string, any>;

export async function listSuperAdmin(resource: SuperAdminResource): Promise<SuperAdminRow[]> {
  const { data } = await http.get<SuperAdminRow[]>(`/super-admin/${resource}`);
  return data;
}

export async function createSuperAdmin(resource: SuperAdminResource, body: Record<string, unknown>): Promise<void> {
  await http.post(`/super-admin/${resource}`, body);
}

export async function updateSuperAdmin(
  resource: SuperAdminResource,
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  await http.put(`/super-admin/${resource}/${id}`, body);
}

export async function deleteSuperAdmin(resource: SuperAdminResource, id: string): Promise<void> {
  await http.delete(`/super-admin/${resource}/${id}`);
}

// Backend errors look like { success: false, message: "..." }.
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (!err.response) return 'Cannot reach the server. Check your connection.';
  }
  return 'Something went wrong. Please try again.';
}
