import { swaggerSpec } from "../../src/config/swagger";

describe("Swagger bearer authorization", () => {
  it("defines an HTTP bearer JWT security scheme", () => {
    const scheme = (swaggerSpec as any).components.securitySchemes.bearerAuth;

    expect(scheme).toMatchObject({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });

  it("applies the bearer scheme to the whole API so the Authorize button sends the token", () => {
    expect((swaggerSpec as any).security).toEqual([{ bearerAuth: [] }]);
  });
});
