import { describe, expect, it } from "vitest";
import { SchoolOnboardingRequestSchema } from "./onboarding";

describe("SchoolOnboardingRequestSchema", () => {
  it("accepts a valid school onboarding request", () => {
    const result = SchoolOnboardingRequestSchema.parse({
      ownerDisplayName: "Ahsanul Haque",
      schoolName: "Demo School",
      schoolCode: "DEMO-SCHOOL",
      branchName: "Main Campus",
      branchCode: "MAIN",
    });

    expect(result.schoolCode).toBe("DEMO-SCHOOL");
  });

  it("rejects lowercase tenant codes", () => {
    const result = SchoolOnboardingRequestSchema.safeParse({
      ownerDisplayName: "Ahsanul Haque",
      schoolName: "Demo School",
      schoolCode: "demo-school",
      branchName: "Main Campus",
      branchCode: "MAIN",
    });

    expect(result.success).toBe(false);
  });
});
