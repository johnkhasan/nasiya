import { prisma } from "@/lib/prisma";
import { DEBT_STATUS } from "@/lib/db/debts";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Cross-tenant by design: this is the batch/cron job's job, not a
// user-scoped request — it has no shop session to scope by.
export function findDebtsNeedingReminder(reminderWindowDays: number) {
  const windowEnd = new Date(startOfToday());
  windowEnd.setDate(windowEnd.getDate() + reminderWindowDays);

  return prisma.debt.findMany({
    where: {
      status: { not: DEBT_STATUS.PAID },
      dueDate: { not: null, lte: windowEnd },
      customer: { telegramChatId: { not: null } },
    },
    include: { customer: { include: { shop: true } } },
  });
}

export async function wasReminderSentToday(debtId: string, channel: string) {
  const existing = await prisma.reminderLog.findFirst({
    where: {
      debtId,
      channel,
      status: "sent",
      sentAt: { gte: startOfToday() },
    },
    select: { id: true },
  });
  return !!existing;
}

export function logReminder(
  debtId: string,
  channel: string,
  status: "sent" | "failed"
) {
  return prisma.reminderLog.create({
    data: { debtId, channel, status },
  });
}
