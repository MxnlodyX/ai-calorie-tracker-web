import { NextResponse } from "next/server";

const apiBaseUrl = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000"
).replace(/\/+$/, "");

type ProxyOptions = {
  request: Request;
  path: string;
  method?: string;
};

export async function proxyBackendRequest({
  request,
  path,
  method = request.method,
}: ProxyOptions) {
  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(`${apiBaseUrl}${path}`);

  targetUrl.search = sourceUrl.search;

  const headers = new Headers({
    accept: request.headers.get("accept") ?? "application/json",
  });
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (cookie) {
    headers.set("cookie", cookie);
  }

  const response = await fetch(targetUrl, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : request.body,
    duplex: "half",
  } as RequestInit);

  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");
  const setCookie = response.headers.get("set-cookie");

  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType);
  }

  if (setCookie) {
    responseHeaders.set("set-cookie", setCookie);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
