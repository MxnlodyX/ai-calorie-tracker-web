import { beforeEach, describe, expect, it, vi } from "vitest";

import { runWithSessionRefresh } from "@/lib/session-refresh";

type RequestResult = { status: number };

const isUnauthorized = (result: RequestResult) => result.status === 401;

describe("session refresh", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("refreshes and retries an unauthorized request once", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    const request = vi
      .fn<() => Promise<RequestResult>>()
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 200 });

    await expect(
      runWithSessionRefresh(request, isUnauthorized),
    ).resolves.toEqual({ status: 200 });

    expect(request).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not refresh errors other than unauthorized", async () => {
    const request = vi.fn().mockResolvedValue({ status: 500 });

    await expect(
      runWithSessionRefresh(request, isUnauthorized),
    ).resolves.toEqual({ status: 500 });

    expect(request).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns the original unauthorized result when refresh fails", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }));
    const request = vi.fn().mockResolvedValue({ status: 401 });

    await expect(
      runWithSessionRefresh(request, isUnauthorized),
    ).resolves.toEqual({ status: 401 });

    expect(request).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("never retries more than once", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    const request = vi.fn().mockResolvedValue({ status: 401 });

    await expect(
      runWithSessionRefresh(request, isUnauthorized),
    ).resolves.toEqual({ status: 401 });

    expect(request).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shares one refresh across concurrent unauthorized requests", async () => {
    let releaseRefresh: ((response: Response) => void) | undefined;
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        releaseRefresh = resolve;
      }),
    );
    const firstRequest = vi
      .fn<() => Promise<RequestResult>>()
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 200 });
    const secondRequest = vi
      .fn<() => Promise<RequestResult>>()
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 200 });

    const firstResult = runWithSessionRefresh(firstRequest, isUnauthorized);
    const secondResult = runWithSessionRefresh(secondRequest, isUnauthorized);

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    releaseRefresh?.(new Response(null, { status: 204 }));

    await expect(Promise.all([firstResult, secondResult])).resolves.toEqual([
      { status: 200 },
      { status: 200 },
    ]);
    expect(firstRequest).toHaveBeenCalledTimes(2);
    expect(secondRequest).toHaveBeenCalledTimes(2);
  });
});
