import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFoods, getMenulists } from "@/features/dashboard/api";

describe("dashboard API", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      ),
    );
  });

  it("loads foods and saved meals without a userId query parameter", async () => {
    await getFoods();
    await getMenulists();

    const requestedUrls = vi
      .mocked(fetch)
      .mock.calls.map(([url]) => String(url));

    expect(requestedUrls[0]).toMatch(/\/foods$/);
    expect(requestedUrls[1]).toMatch(/\/food-lists$/);
    expect(requestedUrls).not.toEqual(
      expect.arrayContaining([expect.stringContaining("userId")]),
    );
  });
});
