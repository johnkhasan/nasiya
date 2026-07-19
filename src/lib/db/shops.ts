import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const TRIAL_DAYS = 30;
const PASSWORD_SALT_ROUNDS = 10;

export type RegisterShopInput = {
  shopName: string;
  ownerName: string;
  phone: string;
  password: string;
};

export async function registerShop(input: RegisterShopInput) {
  const existing = await prisma.user.findUnique({
    where: { phone: input.phone },
  });
  if (existing) {
    throw new Error("Bu telefon raqam bilan foydalanuvchi allaqachon ro'yxatdan o'tgan");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  const planExpiresAt = new Date();
  planExpiresAt.setDate(planExpiresAt.getDate() + TRIAL_DAYS);

  return prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        name: input.shopName,
        phone: input.phone,
        ownerName: input.ownerName,
        plan: "trial",
        planExpiresAt,
      },
    });

    const user = await tx.user.create({
      data: {
        shopId: shop.id,
        phone: input.phone,
        password: passwordHash,
        fullName: input.ownerName,
        role: "owner",
      },
    });

    return { shop, user };
  });
}

export function getShopById(shopId: string) {
  return prisma.shop.findUnique({ where: { id: shopId } });
}
