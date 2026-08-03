import { proxyBackendRequest } from "@/app/api/_lib/proxy";

export function GET(request: Request) {
  return proxyBackendRequest({ request, path: "/food-lists" });
}

export function POST(request: Request) {
  return proxyBackendRequest({ request, path: "/food-lists" });
}
