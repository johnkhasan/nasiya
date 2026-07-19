import "server-only";
import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.shopId || !session.user.id) {
    throw new Error("Unauthorized");
  }
  return {
    shopId: session.user.shopId,
    userId: session.user.id,
    role: session.user.role,
  };
}

export async function requireShopId() {
  return (await requireSession()).shopId;
}

export async function requireOwner() {
  const session = await requireSession();
  if (session.role !== "owner") {
    throw new Error("Faqat do'kon egasi bu amalni bajara oladi");
  }
  return session;
}
