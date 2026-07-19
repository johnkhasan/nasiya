import { prisma } from "@/lib/prisma";
import { DEBT_STATUS } from "@/lib/db/debts";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getDashboardStats(shopId: string) {
  const now = new Date();

  const [openDebts, todayPayments] = await Promise.all([
    prisma.debt.findMany({
      where: { shopId, status: { not: DEBT_STATUS.PAID } },
      include: { customer: { select: { id: true, fullName: true } } },
    }),
    prisma.payment.aggregate({
      where: { debt: { shopId }, paidAt: { gte: startOfToday() } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  let totalOutstanding = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  const byCustomer = new Map<
    string,
    { customerId: string; customerName: string; total: number }
  >();

  for (const debt of openDebts) {
    const remaining = Math.max(
      Number(debt.amount) - Number(debt.paidAmount),
      0
    );
    totalOutstanding += remaining;

    if (debt.dueDate && debt.dueDate < now) {
      overdueAmount += remaining;
      overdueCount += 1;
    }

    const entry = byCustomer.get(debt.customerId) ?? {
      customerId: debt.customerId,
      customerName: debt.customer.fullName,
      total: 0,
    };
    entry.total += remaining;
    byCustomer.set(debt.customerId, entry);
  }

  const topDebtors = [...byCustomer.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totalOutstanding,
    overdueAmount,
    overdueCount,
    openDebtCount: openDebts.length,
    todayPaymentsTotal: Number(todayPayments._sum.amount ?? 0),
    todayPaymentsCount: todayPayments._count,
    topDebtors,
  };
}
