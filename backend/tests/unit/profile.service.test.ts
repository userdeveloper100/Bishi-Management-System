import { prismaMock } from "../helpers/prismaMock";
import { profileService } from "../../src/services/profile.service";

jest.mock("../../src/prismaClient", () => ({ prisma: require("../helpers/prismaMock").prismaMock }));

const USER = {
    id: "u1",
    name: "Asha Patil",
    phone: "+919876544821",
    phoneVerified: true,
    email: null,
    upiId: null,
    language: "hi",
    proUntil: null,
};

describe("profileService.updateLanguage", () => {
    it("saves a supported language and returns the updated profile", async () => {
        prismaMock.user.findUnique.mockResolvedValue({ id: "u1" });
        prismaMock.user.update.mockResolvedValue(USER);

        const profile = await profileService.updateLanguage("u1", "hi");

        expect(prismaMock.user.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: "u1" }, data: { language: "hi" } }),
        );
        expect(profile).toMatchObject({ id: "u1", language: "hi", initials: "AP" });
    });

    it.each([["fr"], [""], [null], [42], [undefined]])("rejects language %p with a 400", async (language) => {
        await expect(profileService.updateLanguage("u1", language)).rejects.toMatchObject({ status: 400 });
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("returns 404 for an unknown user without updating anything", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        await expect(profileService.updateLanguage("missing", "en")).rejects.toMatchObject({ status: 404 });
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
});
