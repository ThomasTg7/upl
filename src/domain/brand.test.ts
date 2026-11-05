import { describe, expect, it } from "vitest";
import { BRAND } from "./brand";

describe("UPL Series identity", () => {
  it("exposes the official name, profile and approved colors", () => {
    expect(BRAND.name).toBe("UPL Series");
    expect(BRAND.shortName).toBe("UPL");
    expect(BRAND.fullName).toBe("Uruguay Premium League Series");
    expect(BRAND.instagramUrl).toBe("https://www.instagram.com/uplseries/");
    expect(BRAND.colors).toMatchObject({ primary: "#D9A82E", deep: "#8A6318", accent: "#F2CE6B" });
  });
});
