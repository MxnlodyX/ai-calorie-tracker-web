import { proxyBackendRequest } from "@/app/api/_lib/proxy";

export function POST(request: Request) {
  return proxyBackendRequest({ request, path: "/upload/food-image" });
}
