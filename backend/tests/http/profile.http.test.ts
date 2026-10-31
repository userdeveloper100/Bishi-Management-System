import request from "supertest";
import { prismaMock } from "../helpers/prismaMock";
import { authService } from "../../src/services/auth.service";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));
jest.mock("../../src/services/sms.service", () => ({
  getSmsSender: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../../src/app").default;

const USER = {
  id: "u1",
  name: "Asha Patil",
  phone: "+919876544821",
  phoneVerified: true,
  email: null,
  upiId: null,
  language: "mr",
  proUntil: null,
};

const token = authService.generateToken({ id: "u1", role: "user" });

describe("PATCH /api/user/profile", () => {
  it("returns 200 with the updated language", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1" });
    prismaMock.user.update.mockResolvedValue(USER);

    const res = await request(app)
      .patch("/api/user/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "mr" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { language: "mr", name: "Asha Patil" },
    });
  });

  it("returns 400 for an unsupported language", async () => {
    const res = await request(app)
      .patch("/api/user/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "xx" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .patch("/api/user/profile")
      .send({ language: "hi" });

    expect(res.status).toBe(401);
  });
});
