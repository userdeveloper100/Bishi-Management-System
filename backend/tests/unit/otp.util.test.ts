import { generateOtp, hashOtp, otpMatches } from "../../src/utils/otp";

const SECRET = "test-secret";
const PHONE = "+919876543210";

describe("generateOtp", () => {
    it("returns a 6-digit numeric string", () => {
        for (let i = 0; i < 200; i++) {
            expect(generateOtp()).toMatch(/^\d{6}$/);
        }
    });

    it("keeps leading zeros", () => {
        const codes = new Set<string>();
        for (let i = 0; i < 2000; i++) codes.add(generateOtp());
        expect([...codes].some((code) => code.startsWith("0"))).toBe(true);
    });
});

describe("hashOtp", () => {
    it("never returns the plain code", () => {
        const hash = hashOtp(PHONE, "123456", SECRET);
        expect(hash).not.toContain("123456");
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("is deterministic for the same phone, code and secret", () => {
        expect(hashOtp(PHONE, "123456", SECRET)).toBe(hashOtp(PHONE, "123456", SECRET));
    });

    it("differs when the phone, code or secret changes", () => {
        const base = hashOtp(PHONE, "123456", SECRET);
        expect(hashOtp("+919812345678", "123456", SECRET)).not.toBe(base);
        expect(hashOtp(PHONE, "654321", SECRET)).not.toBe(base);
        expect(hashOtp(PHONE, "123456", "other-secret")).not.toBe(base);
    });
});

describe("otpMatches", () => {
    it("accepts the correct code", () => {
        const hash = hashOtp(PHONE, "123456", SECRET);
        expect(otpMatches(PHONE, "123456", hash, SECRET)).toBe(true);
    });

    it("rejects a wrong code", () => {
        const hash = hashOtp(PHONE, "123456", SECRET);
        expect(otpMatches(PHONE, "654321", hash, SECRET)).toBe(false);
    });

    it("rejects a stored hash of the wrong length without throwing", () => {
        expect(otpMatches(PHONE, "123456", "abcd", SECRET)).toBe(false);
    });
});
