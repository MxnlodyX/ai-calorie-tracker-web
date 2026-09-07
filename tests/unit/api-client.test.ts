import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";

describe("API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("unwraps successful API envelopes and includes credentials", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "user-1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiGet<{ id: string }>("/users/profile")).resolves.toEqual({
      id: "user-1",
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/users\/profile$/),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it.each([
    ["POST", apiPost],
    ["PUT", apiPut],
    ["PATCH", apiPatch],
  ] as const)("sends JSON for %s requests", async (method, request) => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), { status: 200 }),
    );

    await request<{ ok: boolean }, { name: string }>("/foods", {
      name: "Soup",
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/foods$/),
      expect.objectContaining({
        method,
        body: JSON.stringify({ name: "Soup" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("surfaces backend errors", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
      }),
    );

    await expect(apiGet("/authentications/me")).rejects.toThrow(
      "Session expired",
    );
  });

  it("retries the original request after refreshing the session", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Session expired" }), {
          status: 401,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: "user-1" } }), {
          status: 200,
        }),
      );

    await expect(apiGet<{ id: string }>("/users/profile")).resolves.toEqual({
      id: "user-1",
    });

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/authentications\/refresh$/),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(vi.mocked(fetch).mock.calls[2]).toEqual(
      vi.mocked(fetch).mock.calls[0],
    );
  });

  it("accepts empty 204 delete responses", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiDelete("/foods/food-1")).resolves.toBeUndefined();
  });
});
