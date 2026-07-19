import "server-only";
import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.shopId || !session.user.id) {
    throw new Error("Unauthorized");
  }
  return { shopId: session.user.shopId, userId: session.user.id };
}

export async function requireShopId() {
  return (await requireSession()).shopId;
}
