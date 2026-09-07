"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return undefined;
  }

  return typeof error.status === "number" ? error.status : undefined;
}

export function useRedirectOnUnauthorized(error: unknown) {
  const router = useRouter();

  useEffect(() => {
    if (getErrorStatus(error) === 401) {
      router.replace("/");
    }
  }, [error, router]);
}