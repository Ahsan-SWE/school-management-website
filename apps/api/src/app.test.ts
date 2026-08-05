import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("API health", () => {
  it("returns a valid health response", async () => {
    const response = await app.request("/api/v1/health");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      service: "api",
      status: "ok",
    });
  });

  it("protects academic setup routes", async () => {
    const response = await app.request("/api/v1/academic/overview");

    expect(response.status).toBe(401);
  });
});
