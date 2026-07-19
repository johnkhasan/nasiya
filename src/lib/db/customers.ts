import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type CreateCustomerInput = {
  fullName: string;
  phone: string;
  note?: string;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export function listCustomers(shopId: string, search?: string) {
  const where: Prisma.CustomerWhereInput = {
    shopId,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  return prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export function getCustomerById(shopId: string, id: string) {
  return prisma.customer.findFirst({
    where: { id, shopId },
    include: {
      debts: {
        include: { payments: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export function createCustomer(shopId: string, data: CreateCustomerInput) {
  return prisma.customer.create({
    data: { ...data, shopId },
  });
}

export function countCustomers(shopId: string) {
  return prisma.customer.count({ where: { shopId } });
}

export async function updateCustomer(
  shopId: string,
  id: string,
  data: UpdateCustomerInput
) {
  const { count } = await prisma.customer.updateMany({
    where: { id, shopId },
    data,
  });
  if (count === 0) return null;
  return prisma.customer.findFirst({ where: { id, shopId } });
}

export async function deleteCustomer(shopId: string, id: string) {
  const { count } = await prisma.customer.deleteMany({
    where: { id, shopId },
  });
  return count > 0;
}

// Deliberately unscoped by shopId: the Telegram webhook has no shop
// session — the customer id itself (an unguessable cuid, shared only via
// the connect link a shop sends its own customer) is the capability here.
export function getCustomerByIdUnscoped(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: { shop: { select: { name: true } } },
  });
}

export function setCustomerTelegramChatId(id: string, telegramChatId: string) {
  return prisma.customer.update({
    where: { id },
    data: { telegramChatId },
  });
}
