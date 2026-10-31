import { prismaMock } from "../helpers/prismaMock";
import { otpService, MAX_SENDS_PER_HOUR, MAX_VERIFY_ATTEMPTS } from "../../src/services/otp.service";
import { getSmsSender } from "../../src/services/sms.service";
import { hashOtp } from "../../src/utils/otp";

jest.mock("../../src/prismaClient", () => ({ prisma: require("../helpers/prismaMock").prismaMock }));
jest.mock("../../src/services/sms.service", () => ({ getSmsSender: jest.fn() }));

const PHONE = "+919876543210";
const SECRET = "test-secret";
const sendMock = jest.fn();

beforeEach(() => {
    (getSmsSender as jest.Mock).mockReturnValue({ send: sendMock });
});

function secondsAgo(seconds: number) {
    return new Date(Date.now() - seconds * 1000);
}

describe("otpService.sendOtp", () => {
    it("creates a hashed OTP, sends the plain code by SMS, and returns no code", async () => {
        prismaMock.otpCode.findFirst.mockResolvedValue(null);
        prismaMock.otpCode.count.mockResolvedValue(0);
        prismaMock.otpCode.create.mockResolvedValue({});

        const result = await otpService.sendOtp("9876543210");

        expect(result).toEqual({
            success: true,
            message: "OTP sent",
            expiresInSeconds: 300,
            resendInSeconds: 30,
        });
        expect(JSON.stringify(result)).not.toMatch(/\d{6}/);

        const { data } = prismaMock.otpCode.create.mock.calls[0][0];
        expect(data.phone).toBe(PHONE);
        expect(data.codeHash).toMatch(/^[0-9a-f]{64}$/);
        expect(data.expiresAt.getTime() - Date.now()).toBeGreaterThan(299 * 1000);
        expect(data.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(300 * 1000);

        expect(sendMock).toHaveBeenCalledTimes(1);
        const [to, message] = sendMock.mock.calls[0];
        expect(to).toBe(PHONE);
        const code = message.match(/\b(\d{6})\b/)[1];
        expect(data.codeHash).toBe(hashOtp(PHONE, code, SECRET));
    });

    it("rejects an invalid phone number before touching the database", async () => {
        await expect(otpService.sendOtp("12345")).rejects.toMatchObject({ status: 400 });
        expect(prismaMock.otpCode.create).not.toHaveBeenCalled();
        expect(sendMock).not.toHaveBeenCalled();
    });

    it("blocks a resend within the 30-second cooldown with a 429", async () => {
        prismaMock.otpCode.findFirst.mockResolvedValue({ createdAt: secondsAgo(10) });

        await expect(otpService.sendOtp(PHONE)).rejects.toMatchObject({ status: 429 });
        expect(prismaMock.otpCode.create).not.toHaveBeenCalled();
        expect(sendMock).not.toHaveBeenCalled();
    });

    it("allows a resend after the cooldown has passed", async () => {
        prismaMock.otpCode.findFirst.mockResolvedValue({ createdAt: secondsAgo(45) });
        prismaMock.otpCode.count.mockResolvedValue(1);
        prismaMock.otpCode.create.mockResolvedValue({});

        await expect(otpService.sendOtp(PHONE)).resolves.toMatchObject({ success: true });
    });

    it("caps the number of OTPs per phone per hour with a 429", async () => {
        prismaMock.otpCode.findFirst.mockResolvedValue(null);
        prismaMock.otpCode.count.mockResolvedValue(MAX_SENDS_PER_HOUR);

        await expect(otpService.sendOtp(PHONE)).rejects.toMatchObject({ status: 429 });
        expect(prismaMock.otpCode.create).not.toHaveBeenCalled();
    });
});

describe("otpService.verifyOtp", () => {
    const CODE = "482616";

    function storedOtp(overrides: Record<string, unknown> = {}) {
        return {
            id: "otp1",
            phone: PHONE,
            codeHash: hashOtp(PHONE, CODE, SECRET),
            expiresAt: new Date(Date.now() + 60 * 1000),
            attempts: 0,
            consumedAt: null,
            createdAt: secondsAgo(5),
            ...overrides,
        };
    }

    it("accepts the correct code, consumes it, and returns the phone", async () => {
        prismaMock.otpCode.findFirst.mockResolvedValue(storedOtp());
        prismaMock.otpCode.update.mockResolvedValue({});

        await expect(otpService.verifyOtp("9876543210", CODE)).resolves.toBe(PHONE);

        const update = prismaMock.otpCode.update.mock.calls[0][0];
        expect(update.where).toEqual({ id: "otp1" });
        expect(update.data.consumedAt).toBeInstanceOf(Date);
    });

    it("only looks at unused OTPs, so a consumed code cannot be reused", async () => {
        prismaMock.otpCode.findFirst.mockResolvedValue(null);

        await expect(otpService.verifyOtp(PHONE, CODE)).rejects.toMatchObject({
            status: 401,
            message: "OTP expired or not found",
        });
        expect(prismaMock.otpCode.findFirst.mock.calls[0][0].where).toEqual({ phone: PHONE, consumedAt: null });
    });

    it("rejects an expired OTP with a 401", async () => {
        prismaMock.otpCode.findFirst.mockResolvedValue(storedOtp({ expiresAt: secondsAgo(1) }));

        await expect(otpService.verifyOtp(PHONE, CODE)).rejects.toMatchObject({
            status: 401,
            message: "OTP expired or not found",
        });
        expect(prismaMock.otpCode.update).not.toHaveBeenCalled();
    });

    it("rejects a wrong code with a 401 and counts the attempt", async () => {
        prismaMock.otpCode.findFirst.mockResolvedValue(storedOtp());
        prismaMock.otpCode.update.mockResolvedValue({ attempts: 1 });

        await expect(otpService.verifyOtp(PHONE, "000000")).rejects.toMatchObject({
            status: 401,
            message: "Invalid OTP",
        });
        expect(prismaMock.otpCode.update.mock.calls[0][0].data).toEqual({ attempts: { increment: 1 } });
    });

    it("returns 429 on the attempt that reaches the limit", async () => {
        prismaMock.otpCode.findFirst.mockResolvedValue(storedOtp({ attempts: MAX_VERIFY_ATTEMPTS - 1 }));
        prismaMock.otpCode.update.mockResolvedValue({ attempts: MAX_VERIFY_ATTEMPTS });

        await expect(otpService.verifyOtp(PHONE, "000000")).rejects.toMatchObject({ status: 429 });
    });

    it("returns 429 without checking the code once attempts are exhausted", async () => {
        prismaMock.otpCode.findFirst.mockResolvedValue(storedOtp({ attempts: MAX_VERIFY_ATTEMPTS }));

        await expect(otpService.verifyOtp(PHONE, CODE)).rejects.toMatchObject({ status: 429 });
        expect(prismaMock.otpCode.update).not.toHaveBeenCalled();
    });

    it("rejects a code that is not six digits with a 400", async () => {
        await expect(otpService.verifyOtp(PHONE, "12345")).rejects.toMatchObject({ status: 400 });
        await expect(otpService.verifyOtp(PHONE, 482616)).rejects.toMatchObject({ status: 400 });
        expect(prismaMock.otpCode.findFirst).not.toHaveBeenCalled();
    });
});

describe("local test OTP (560142)", () => {
    const LOCAL_CODE = "560142";
    const savedEnv = { NODE_ENV: process.env.NODE_ENV, USE_LOCAL_OTP: process.env.USE_LOCAL_OTP };

    afterEach(() => {
        process.env.NODE_ENV = savedEnv.NODE_ENV;
        if (savedEnv.USE_LOCAL_OTP === undefined) delete process.env.USE_LOCAL_OTP;
        else process.env.USE_LOCAL_OTP = savedEnv.USE_LOCAL_OTP;
    });

    it("accepts 560142 when NODE_ENV=development, without a stored OTP", async () => {
        process.env.NODE_ENV = "development";

        await expect(otpService.verifyOtp(PHONE, LOCAL_CODE)).resolves.toBe(PHONE);
        expect(prismaMock.otpCode.findFirst).not.toHaveBeenCalled();
    });

    it("accepts 560142 when USE_LOCAL_OTP=true", async () => {
        process.env.NODE_ENV = "test";
        process.env.USE_LOCAL_OTP = "true";

        await expect(otpService.verifyOtp(PHONE, LOCAL_CODE)).resolves.toBe(PHONE);
    });

    it("rejects 560142 when local mode is off", async () => {
        process.env.NODE_ENV = "test";
        delete process.env.USE_LOCAL_OTP;
        prismaMock.otpCode.findFirst.mockResolvedValue(null);

        await expect(otpService.verifyOtp(PHONE, LOCAL_CODE)).rejects.toMatchObject({ status: 401 });
    });

    it("never accepts 560142 in production, even with USE_LOCAL_OTP=true", async () => {
        process.env.NODE_ENV = "production";
        process.env.USE_LOCAL_OTP = "true";
        prismaMock.otpCode.findFirst.mockResolvedValue(null);

        await expect(otpService.verifyOtp(PHONE, LOCAL_CODE)).rejects.toMatchObject({ status: 401 });
    });

    it("still accepts the real emailed code while local mode is on", async () => {
        process.env.NODE_ENV = "development";
        const code = "482616";
        prismaMock.otpCode.findFirst.mockResolvedValue({
            id: "otp1",
            phone: PHONE,
            codeHash: hashOtp(PHONE, code, SECRET),
            expiresAt: new Date(Date.now() + 60 * 1000),
            attempts: 0,
            consumedAt: null,
            createdAt: secondsAgo(5),
        });
        prismaMock.otpCode.update.mockResolvedValue({});

        await expect(otpService.verifyOtp(PHONE, code)).resolves.toBe(PHONE);
    });

    it("logs the test code on send in local mode", async () => {
        process.env.NODE_ENV = "development";
        const log = jest.spyOn(console, "log").mockImplementation(() => undefined);
        prismaMock.otpCode.findFirst.mockResolvedValue(null);
        prismaMock.otpCode.count.mockResolvedValue(0);
        prismaMock.otpCode.create.mockResolvedValue({});

        await otpService.sendOtp(PHONE);

        expect(log).toHaveBeenCalledWith(expect.stringContaining(`code ${LOCAL_CODE} is also accepted`));
        log.mockRestore();
    });
});
