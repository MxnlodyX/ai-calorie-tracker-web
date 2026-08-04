import { proxyBackendRequest } from "@/app/api/_lib/proxy";

export async function POST(
  request: Request,
  context: RouteContext<"/api/analyze/[id]/reject">,
) {
  const { id } = await context.params;

  return proxyBackendRequest({
    request,
    path: `/analyze/${encodeURIComponent(id)}/reject`,
  });
}
