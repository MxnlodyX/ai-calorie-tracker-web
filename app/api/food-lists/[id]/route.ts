import { proxyBackendRequest } from "@/app/api/_lib/proxy";

type FoodListRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getFoodListPath(context: FoodListRouteContext) {
  const { id } = await context.params;

  return `/food-lists/${encodeURIComponent(id)}`;
}

export async function GET(request: Request, context: FoodListRouteContext) {
  return proxyBackendRequest({ request, path: await getFoodListPath(context) });
}

export async function PATCH(request: Request, context: FoodListRouteContext) {
  return proxyBackendRequest({ request, path: await getFoodListPath(context) });
}

export async function DELETE(request: Request, context: FoodListRouteContext) {
  return proxyBackendRequest({ request, path: await getFoodListPath(context) });
}
