import type { SuperAdminResource, SuperAdminRow } from '@/services/api.service';
import { formatINR } from '@/utils/format';

export interface SuperAdminField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'password' | 'number' | 'select';
  /** Required when creating. Blank values are left out of the request. */
  required?: boolean;
  /** Shown only when creating (for example the owner of a new bishi). */
  createOnly?: boolean;
  /** Static choices for a select. */
  options?: Array<{ value: string; label: string }>;
  /** A select whose choices come from another resource's rows. */
  optionsFrom?: SuperAdminResource;
  /** Label for one row of optionsFrom. Defaults to the row's name or title. */
  optionLabel?: (row: SuperAdminRow) => string;
}

export interface SuperAdminColumn {
  label: string;
  value: (row: SuperAdminRow) => string;
}

export interface SuperAdminResourceConfig {
  resource: SuperAdminResource;
  title: string;
  description: string;
  columns: SuperAdminColumn[];
  fields: SuperAdminField[];
  /** Name shown in the delete confirmation. */
  rowLabel: (row: SuperAdminRow) => string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const dateOf = (iso: unknown) => (typeof iso === 'string' ? new Date(iso).toLocaleDateString('en-IN') : '');

const userLabel = (row: SuperAdminRow) => `${row.name} · ${row.phone ?? 'no phone'}`;

export const SUPER_ADMIN_RESOURCES: Record<SuperAdminResource, SuperAdminResourceConfig> = {
  users: {
    resource: 'users',
    title: 'Users',
    description: 'Every account, its phone number, and its role.',
    columns: [
      { label: 'Name', value: (r) => r.name },
      { label: 'Phone', value: (r) => r.phone ?? '' },
      { label: 'Role', value: (r) => r.role?.name ?? '' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone (10 digits)', type: 'tel', required: true },
      { key: 'email', label: 'Email (optional)', type: 'email' },
      { key: 'roleId', label: 'Role', type: 'select', required: true, optionsFrom: 'roles', optionLabel: (r) => r.name },
      { key: 'password', label: 'Password (optional, for email sign-in)', type: 'password' },
    ],
    rowLabel: (r) => r.name,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  roles: {
    resource: 'roles',
    title: 'Roles',
    description: 'Roles and how many users hold each one.',
    columns: [
      { label: 'Name', value: (r) => r.name },
      { label: 'Users', value: (r) => String(r._count?.users ?? 0) },
      { label: 'Permissions', value: (r) => String(r._count?.permissions ?? 0) },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    rowLabel: (r) => r.name,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  permissions: {
    resource: 'permissions',
    title: 'Permissions',
    description: 'The named permissions that roles can be given.',
    columns: [
      { label: 'Name', value: (r) => r.name },
      { label: 'Roles', value: (r) => String(r._count?.roles ?? 0) },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    rowLabel: (r) => r.name,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  'role-permissions': {
    resource: 'role-permissions',
    title: 'Role permissions',
    description: 'Which permissions each role holds. Revoking removes the link.',
    columns: [
      { label: 'Role', value: (r) => r.role?.name ?? '' },
      { label: 'Permission', value: (r) => r.permission?.name ?? '' },
    ],
    fields: [
      { key: 'roleId', label: 'Role', type: 'select', required: true, optionsFrom: 'roles', optionLabel: (r) => r.name },
      {
        key: 'permissionId',
        label: 'Permission',
        type: 'select',
        required: true,
        optionsFrom: 'permissions',
        optionLabel: (r) => r.name,
      },
    ],
    rowLabel: (r) => `${r.role?.name} · ${r.permission?.name}`,
    canCreate: true,
    canEdit: false,
    canDelete: true,
  },

  groups: {
    resource: 'groups',
    title: 'Groups',
    description: 'Every Bhishi group, across all organisers.',
    columns: [
      { label: 'Name', value: (r) => r.name },
      { label: 'Members', value: (r) => String(r._count?.membership ?? 0) },
      { label: 'Monthly', value: (r) => formatINR(Number(r.monthlyContribution ?? 0)) },
      { label: 'Status', value: (r) => r.status ?? '' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'cycleMonths', label: 'Cycle (months)', type: 'number', required: true },
      { key: 'monthlyContribution', label: 'Monthly contribution (₹)', type: 'number', required: true },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'OPEN', label: 'OPEN' },
          { value: 'BIDDING', label: 'BIDDING' },
          { value: 'CLOSED', label: 'CLOSED' },
        ],
      },
    ],
    rowLabel: (r) => r.name,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  bishis: {
    resource: 'bishis',
    title: 'Bishis',
    description: 'Rounds across every group, with their group and owner.',
    columns: [
      { label: 'Title', value: (r) => r.title },
      { label: 'Group', value: (r) => r.group?.name ?? '' },
      { label: 'Owner', value: (r) => r.owner?.name ?? '' },
    ],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'groupId', label: 'Group', type: 'select', required: true, createOnly: true, optionsFrom: 'groups', optionLabel: (r) => r.name },
      { key: 'ownerId', label: 'Owner', type: 'select', required: true, createOnly: true, optionsFrom: 'users', optionLabel: userLabel },
    ],
    rowLabel: (r) => r.title,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  transactions: {
    resource: 'transactions',
    title: 'Transactions',
    description: 'Read-only record of transactions across groups.',
    columns: [
      { label: 'Bishi', value: (r) => r.bishi?.title ?? '' },
      { label: 'Member', value: (r) => r.user?.name ?? '' },
      { label: 'Amount', value: (r) => formatINR(Number(r.amount ?? 0)) },
      { label: 'Date', value: (r) => dateOf(r.created_date) },
    ],
    fields: [],
    rowLabel: (r) => r.id,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },

  'audit-logs': {
    resource: 'audit-logs',
    title: 'Audit logs',
    description: 'Read-only trail of every change, newest first.',
    columns: [
      { label: 'Action', value: (r) => r.action },
      { label: 'Entity', value: (r) => r.entity },
      { label: 'Performed by', value: (r) => r.performedBy },
      { label: 'Date', value: (r) => dateOf(r.created_date) },
    ],
    fields: [],
    rowLabel: (r) => r.action,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
};

/** The order the index page lists the master screens in. */
export const SUPER_ADMIN_ORDER: SuperAdminResource[] = [
  'users',
  'roles',
  'permissions',
  'role-permissions',
  'groups',
  'bishis',
  'transactions',
  'audit-logs',
];

export function isSuperAdminResource(value: unknown): value is SuperAdminResource {
  return typeof value === 'string' && (SUPER_ADMIN_ORDER as string[]).includes(value);
}

/** The label shown for a select option. */
export function optionText(field: SuperAdminField, row: SuperAdminRow): string {
  if (field.optionLabel) return field.optionLabel(row);
  return String(row.name ?? row.title ?? row.id);
}

/**
 * Turns the form values into a request body.
 * Blank optional fields are left out, so an edit keeps the stored value. A blank required field
 * on create, or a bad number, throws with a message the form can show.
 */
export function buildPayload(
  fields: SuperAdminField[],
  values: Record<string, string>,
  mode: 'create' | 'edit',
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of fields) {
    if (mode === 'edit' && field.createOnly) continue;
    const raw = (values[field.key] ?? '').trim();
    if (raw === '') {
      if (mode === 'create' && field.required) throw new Error(`${field.label} is required`);
      continue;
    }
    if (field.type === 'number') {
      const number = Number(raw);
      if (!Number.isFinite(number)) throw new Error(`${field.label} must be a number`);
      body[field.key] = number;
    } else {
      body[field.key] = raw;
    }
  }
  return body;
}
