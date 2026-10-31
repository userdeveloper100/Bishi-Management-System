import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';

import GroupCard from '@/components/GroupCard.vue';
import type { GroupSummary } from '@/services/api.service';

const now = new Date(2026, 9, 31, 9, 0);

const testBhishi: GroupSummary = {
  id: 'g1',
  name: 'Test Bhishi',
  memberCount: 8,
  cycleMonths: 10,
  monthlyContribution: 32000,
  status: 'BIDDING',
  nextBid: { round: 4, at: new Date(2026, 9, 31, 19, 0).toISOString() },
  role: 'owner',
};

function mountCard(group: GroupSummary = testBhishi) {
  return mount(GroupCard, {
    props: { group, now },
    global: { stubs: { 'ion-icon': true } },
  });
}

describe('GroupCard', () => {
  test('shows the group name, member count and cycle length', () => {
    const wrapper = mountCard();

    expect(wrapper.text()).toContain('Test Bhishi');
    expect(wrapper.text()).toContain('8 members · 10-month circle');
  });

  test('formats the monthly contribution in rupees', () => {
    const wrapper = mountCard();
    expect(wrapper.get('[data-testid="monthly-contribution"]').text()).toBe('₹32,000');
  });

  test('shows the bidding status badge', () => {
    const wrapper = mountCard();
    expect(wrapper.get('[data-testid="status-badge"]').text()).toBe('BIDDING');
  });

  test('shows the next bid round and time', () => {
    const wrapper = mountCard();
    expect(wrapper.text()).toContain('Next bid · Round 04');
    expect(wrapper.text()).toContain('Today, 7:00 PM');
  });

  test('says when no bid is scheduled', () => {
    const wrapper = mountCard({ ...testBhishi, status: 'OPEN', nextBid: null });

    expect(wrapper.text()).toContain('Next bid · Round —');
    expect(wrapper.text()).toContain('Not scheduled');
    expect(wrapper.get('[data-testid="status-badge"]').text()).toBe('OPEN');
  });

  test('emits add-members with the group id', async () => {
    const wrapper = mountCard();

    await wrapper.get('[data-testid="add-members"]').trigger('click');

    expect(wrapper.emitted('add-members')).toEqual([['g1']]);
  });
});
