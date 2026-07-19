import "server-only";
import { auth } from "@/lib/auth";

export async function requireShopId() {
  const session = await auth();
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized");
  }
  return session.user.shopId;
}
