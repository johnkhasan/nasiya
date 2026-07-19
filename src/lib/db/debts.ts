import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const DEBT_STATUS = {
  OPEN: "open",
  PARTIALLY_PAID: "partially_paid",
  PAID: "paid",
} as const;

export type DebtStatus = (typeof DEBT_STATUS)[keyof typeof DEBT_STATUS];

export type DecimalInput = Prisma.Decimal | number | string;

export function computeDebtStatus(
  amount: DecimalInput,
  paidAmount: DecimalInput
): DebtStatus {
  const total = new Prisma.Decimal(amount);
  const paid = new Prisma.Decimal(paidAmount);

  if (paid.greaterThanOrEqualTo(total)) return DEBT_STATUS.PAID;
  if (paid.greaterThan(0)) return DEBT_STATUS.PARTIALLY_PAID;
  return DEBT_STATUS.OPEN;
}

export type CreateDebtInput = {
  customerId: string;
  amount: DecimalInput;
  description?: string;
  dueDate?: Date;
};

export function listDebts(
  shopId: string,
  opts?: { status?: DebtStatus; customerId?: string }
) {
  return prisma.debt.findMany({
    where: {
      shopId,
      status: opts?.status,
      customerId: opts?.customerId,
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getDebtById(shopId: string, id: string) {
  return prisma.debt.findFirst({
    where: { id, shopId },
    include: { customer: true, payments: { orderBy: { paidAt: "desc" } } },
  });
}

export async function createDebt(shopId: string, data: CreateDebtInput) {
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, shopId },
    select: { id: true },
  });
  if (!customer) {
    throw new Error("Customer not found for this shop");
  }

  return prisma.debt.create({
    data: {
      shopId,
      customerId: data.customerId,
      amount: data.amount,
      description: data.description,
      dueDate: data.dueDate,
      status: DEBT_STATUS.OPEN,
    },
  });
}
