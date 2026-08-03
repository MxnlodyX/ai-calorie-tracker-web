import { proxyBackendRequest } from "@/app/api/_lib/proxy";

type FoodRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getFoodPath(context: FoodRouteContext) {
  const { id } = await context.params;

  return `/foods/${encodeURIComponent(id)}`;
}

export async function GET(request: Request, context: FoodRouteContext) {
  return proxyBackendRequest({ request, path: await getFoodPath(context) });
}

export async function PATCH(request: Request, context: FoodRouteContext) {
  return proxyBackendRequest({ request, path: await getFoodPath(context) });
}

export async function DELETE(request: Request, context: FoodRouteContext) {
  return proxyBackendRequest({ request, path: await getFoodPath(context) });
}
