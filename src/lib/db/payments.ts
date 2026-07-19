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
