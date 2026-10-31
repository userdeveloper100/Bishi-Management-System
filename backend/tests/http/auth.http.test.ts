import request from "supertest";
import { prismaMock } from "../helpers/prismaMock";
import { getSmsSender } from "../../src/services/sms.service";
import { hashOtp } from "../../src/utils/otp";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));
jest.mock("../../src/services/sms.service", () => ({
  getSmsSender: jest.fn(),
}));

// Imported after the mocks so the app picks up the mocked modules.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../../src/app").default;

const PHONE = "+919876543210";
const CODE = "482616";
const sendMock = jest.fn();

beforeEach(() => {
  (getSmsSender as jest.Mock).mockReturnValue({ send: sendMock });
});

describe("POST /api/auth/send-otp", () => {
  it("returns 200 with timing info and sends the code by SMS", async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue(null);
    prismaMock.otpCode.count.mockResolvedValue(0);
    prismaMock.otpCode.create.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: "9876543210" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "OTP sent",
      expiresInSeconds: 300,
      resendInSeconds: 30,
    });
    expect(JSON.stringify(res.body)).not.toMatch(/\b\d{6}\b/);
    expect(sendMock).toHaveBeenCalledWith(
      PHONE,
      expect.stringContaining("BhishiPay code is"),
    );
  });

  it("returns 400 for an invalid phone number", async () => {
    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: "123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(prismaMock.otpCode.create).not.toHaveBeenCalled();
  });

  it("returns 400 when the phone is missing", async () => {
    const res = await request(app).post("/api/auth/send-otp").send({});

    expect(res.status).toBe(400);
  });

  it("returns 429 when a resend is requested inside the cooldown", async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue({ createdAt: new Date() });

    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: PHONE });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/auth/verify-otp", () => {
  function storedOtp() {
    return {
      id: "otp1",
      phone: PHONE,
      codeHash: hashOtp(PHONE, CODE, process.env.JWT_SECRET as string),
      expiresAt: new Date(Date.now() + 60 * 1000),
      attempts: 0,
      consumedAt: null,
      createdAt: new Date(),
    };
  }

  it("returns 200 with a token and user for a correct code", async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue(storedOtp());
    prismaMock.otpCode.update.mockResolvedValue({});
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.role.findUnique.mockResolvedValue({
      id: "role-user",
      name: "user",
    });
    prismaMock.user.create.mockResolvedValue({
      id: "u1",
      name: "Member",
      phone: PHONE,
      role: { name: "user" },
    });

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: PHONE, otp: CODE });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toEqual({
      id: "u1",
      name: "Member",
      phone: PHONE,
      role: "user",
      isNewUser: true,
    });
  });

  it("returns 401 'Invalid OTP' for a wrong code", async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue(storedOtp());
    prismaMock.otpCode.update.mockResolvedValue({ attempts: 1 });

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: PHONE, otp: "000000" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: "Invalid OTP" });
  });

  it("returns 401 when no OTP exists for the phone", async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: PHONE, otp: CODE });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("OTP expired or not found");
  });

  it("returns 400 when the code is not six digits", async () => {
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: PHONE, otp: "12" });

    expect(res.status).toBe(400);
  });

  it("returns 429 once attempts are exhausted", async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue({
      ...storedOtp(),
      attempts: 5,
    });

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: PHONE, otp: CODE });

    expect(res.status).toBe(429);
  });
});

describe("existing email login", () => {
  it("still returns 401 for an unknown email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "x@example.com", password: "nope" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });
});

describe("POST /api/auth/verify-otp with the local test code", () => {
  const savedNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = savedNodeEnv;
  });

  it("returns a token for 560142 in development, without a stored OTP", async () => {
    process.env.NODE_ENV = "development";
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Member",
      phone: PHONE,
      role: { name: "user" },
    });
    prismaMock.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: PHONE, otp: "560142" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toMatchObject({
      id: "u1",
      phone: PHONE,
      isNewUser: false,
    });
  });

  it("returns 401 for 560142 in production", async () => {
    process.env.NODE_ENV = "production";
    prismaMock.otpCode.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: PHONE, otp: "560142" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: "OTP expired or not found",
    });
  });
});

describe("POST /api/auth/send-otp for the dummy number", () => {
  it("returns 200 with no SMS in development", async () => {
    const savedNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);

    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: "1234567890" });

    expect(res.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
    log.mockRestore();
    process.env.NODE_ENV = savedNodeEnv;
  });
});
