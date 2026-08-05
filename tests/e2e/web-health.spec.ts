import { expect, test } from "@playwright/test";

test("web health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body).toMatchObject({
    service: "web",
    status: "ok",
  });
});
