import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { computeDebtStatus, type DecimalInput } from "@/lib/db/debts";

export type CreatePaymentInput = {
  debtId: string;
  amount: DecimalInput;
  method?: string;
  note?: string;
  createdBy?: string;
};

export function listPaymentsByDebt(shopId: string, debtId: string) {
  return prisma.payment.findMany({
    where: { debtId, debt: { shopId } },
    orderBy: { paidAt: "desc" },
  });
}

export async function createPayment(shopId: string, data: CreatePaymentInput) {
  return prisma.$transaction(async (tx) => {
    const debt = await tx.debt.findFirst({
      where: { id: data.debtId, shopId },
    });
    if (!debt) {
      throw new Error("Debt not found for this shop");
    }

    const remaining = debt.amount.minus(debt.paidAmount);
    if (remaining.lte(0)) {
      throw new Error("Bu qarz allaqachon to'liq to'langan");
    }

    const amount = new Prisma.Decimal(data.amount);
    if (amount.lte(0)) {
      throw new Error("To'lov summasi musbat bo'lishi kerak");
    }
    if (amount.gt(remaining)) {
      throw new Error(
        `To'lov summasi qoldiqdan (${remaining.toString()}) katta bo'lishi mumkin emas`
      );
    }

    const payment = await tx.payment.create({
      data: {
        debtId: debt.id,
        amount: data.amount,
        method: data.method ?? "cash",
        note: data.note,
        createdBy: data.createdBy,
      },
    });

    const newPaidAmount = debt.paidAmount.plus(payment.amount);
    const newStatus = computeDebtStatus(debt.amount, newPaidAmount);

    const updatedDebt = await tx.debt.update({
      where: { id: debt.id },
      data: { paidAmount: newPaidAmount, status: newStatus },
    });

    return { payment, debt: updatedDebt };
  });
}
