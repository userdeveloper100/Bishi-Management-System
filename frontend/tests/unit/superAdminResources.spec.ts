import { describe, expect, test } from 'vitest';

import {
  SUPER_ADMIN_ORDER,
  SUPER_ADMIN_RESOURCES,
  buildPayload,
  isSuperAdminResource,
} from '@/utils/superAdminResources';

describe('master settings configuration', () => {
  test('has a screen for every master resource, in the index order', () => {
    expect([...SUPER_ADMIN_ORDER].sort()).toEqual(Object.keys(SUPER_ADMIN_RESOURCES).sort());
  });

  test('transactions and audit logs are read-only', () => {
    for (const resource of ['transactions', 'audit-logs'] as const) {
      const config = SUPER_ADMIN_RESOURCES[resource];
      expect(config.canCreate).toBe(false);
      expect(config.canEdit).toBe(false);
      expect(config.canDelete).toBe(false);
    }
  });

  test('role-permission links can be added and revoked, but not edited', () => {
    const config = SUPER_ADMIN_RESOURCES['role-permissions'];
    expect(config.canCreate).toBe(true);
    expect(config.canEdit).toBe(false);
    expect(config.canDelete).toBe(true);
  });

  test('recognises only known resource names', () => {
    expect(isSuperAdminResource('users')).toBe(true);
    expect(isSuperAdminResource('audit-logs')).toBe(true);
    expect(isSuperAdminResource('secrets')).toBe(false);
    expect(isSuperAdminResource(undefined)).toBe(false);
  });
});

describe('buildPayload', () => {
  const fields = SUPER_ADMIN_RESOURCES.users.fields;

  test('keeps filled values and trims them', () => {
    const body = buildPayload(
      fields,
      { name: '  Asha  ', phone: '9876543210', email: '', roleId: 'r1', password: '' },
      'create',
    );
    expect(body).toEqual({ name: 'Asha', phone: '9876543210', roleId: 'r1' });
  });

  test('turns number fields into numbers', () => {
    const groupFields = SUPER_ADMIN_RESOURCES.groups.fields;
    const body = buildPayload(
      groupFields,
      { name: 'Circle', cycleMonths: '10', monthlyContribution: '2500.5', status: 'OPEN' },
      'create',
    );
    expect(body).toEqual({ name: 'Circle', cycleMonths: 10, monthlyContribution: 2500.5, status: 'OPEN' });
  });

  test('refuses a blank required field on create, with the field label in the message', () => {
    expect(() => buildPayload(fields, { name: '', phone: '9876543210', roleId: 'r1' }, 'create')).toThrow(
      'Name is required',
    );
  });

  test('allows a blank required field on edit, so the stored value stays', () => {
    const body = buildPayload(fields, { name: 'Asha', phone: '', roleId: '' }, 'edit');
    expect(body).toEqual({ name: 'Asha' });
  });

  test('refuses a number field that is not a number', () => {
    const groupFields = SUPER_ADMIN_RESOURCES.groups.fields;
    expect(() =>
      buildPayload(groupFields, { name: 'Circle', cycleMonths: 'ten', monthlyContribution: '1' }, 'create'),
    ).toThrow('Cycle (months) must be a number');
  });

  test('leaves out create-only fields when editing', () => {
    const bishiFields = SUPER_ADMIN_RESOURCES.bishis.fields;
    const body = buildPayload(
      bishiFields,
      { title: 'Round 4', description: '', groupId: 'g1', ownerId: 'u1' },
      'edit',
    );
    expect(body).toEqual({ title: 'Round 4' });
  });
});
