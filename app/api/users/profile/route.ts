import { proxyBackendRequest } from "@/app/api/_lib/proxy";

export function GET(request: Request) {
  return proxyBackendRequest({ request, path: "/users/profile" });
}

export function PUT(request: Request) {
  return proxyBackendRequest({ request, path: "/users/profile" });
}
