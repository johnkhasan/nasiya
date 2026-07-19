import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const PASSWORD_SALT_ROUNDS = 10;

export function listUsersByShop(shopId: string) {
  return prisma.user.findMany({
    where: { shopId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });
}

export type CreateStaffInput = {
  fullName: string;
  phone: string;
  password: string;
};

export async function createStaffUser(shopId: string, input: CreateStaffInput) {
  const existing = await prisma.user.findUnique({
    where: { phone: input.phone },
  });
  if (existing) {
    throw new Error("Bu telefon raqam bilan foydalanuvchi allaqachon mavjud");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  return prisma.user.create({
    data: {
      shopId,
      fullName: input.fullName,
      phone: input.phone,
      password: passwordHash,
      role: "staff",
    },
  });
}

export async function deleteStaffUser(shopId: string, userId: string) {
  const { count } = await prisma.user.deleteMany({
    where: { id: userId, shopId, role: "staff" },
  });
  return count > 0;
}
