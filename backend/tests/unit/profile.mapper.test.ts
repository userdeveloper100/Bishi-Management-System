import {
  isProActive,
  ProfileRow,
  toInitials,
  toProfile,
} from "../../src/services/profile.mapper";

const NOW = new Date("2026-10-31T12:00:00.000Z");

function profile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: "u1",
    name: "Sp",
    phone: "+919876543210",
    phoneVerified: true,
    email: null,
    upiId: null,
    language: "en",
    proUntil: null,
    ...overrides,
  };
}

describe("toInitials", () => {
  it.each([
    ["Shailendra Pardeshi", "SP"],
    ["  amit   kumar  singh ", "AK"],
    ["Sp", "SP"],
    ["Priya", "PR"],
    ["", "?"],
    ["   ", "?"],
  ])("turns %p into %s", (name, expected) => {
    expect(toInitials(name)).toBe(expected);
  });
});

describe("isProActive", () => {
  it("is false with no subscription date", () => {
    expect(isProActive(null, NOW)).toBe(false);
  });

  it("is true while the subscription runs past now, and false once it has ended", () => {
    expect(isProActive(new Date("2026-12-01T00:00:00.000Z"), NOW)).toBe(true);
    expect(isProActive(new Date("2026-10-01T00:00:00.000Z"), NOW)).toBe(false);
  });
});

describe("toProfile", () => {
  it("reports no Pro plan when the subscription is inactive", () => {
    expect(toProfile(profile(), NOW)).toEqual({
      id: "u1",
      name: "Sp",
      initials: "SP",
      phone: "+919876543210",
      phoneVerified: true,
      email: null,
      upiId: null,
      language: "en",
      pro: {
        active: false,
        planName: null,
        price: null,
        currency: "INR",
        period: null,
      },
    });
  });

  it("reports the Pro plan details when the subscription is active", () => {
    const result = toProfile(
      profile({ proUntil: new Date("2027-01-01T00:00:00.000Z") }),
      NOW,
    );
    expect(result.pro).toEqual({
      active: true,
      planName: "BhishiPay Pro",
      price: 299,
      currency: "INR",
      period: "3 months",
    });
  });
});
