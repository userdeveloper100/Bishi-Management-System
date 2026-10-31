import { normalizePhone } from "../../src/utils/phone";
import { statusOf } from "../helpers/statusOf";

describe("normalizePhone", () => {
    it.each([
        ["9876543210", "+919876543210"],
        ["+919876543210", "+919876543210"],
        ["98765 43210", "+919876543210"],
        ["+91-98765-43210", "+919876543210"],
    ])("normalises %s to %s", (input, expected) => {
        expect(normalizePhone(input)).toBe(expected);
    });

    it.each([
        ["12345"],
        ["5876543210"],
        ["98765432101"],
        ["+14155550123"],
        ["abcdefghij"],
        [""],
    ])("rejects %p with a 400", (input) => {
        expect(statusOf(() => normalizePhone(input))).toBe(400);
    });

    it("rejects non-string input with a 400", () => {
        expect(() => normalizePhone(9876543210)).toThrow("phone is required");
        expect(() => normalizePhone(undefined)).toThrow("phone is required");
    });
});
