import "dotenv/config";
import cron from "node-cron";
import { findDebtsNeedingReminder, logReminder, wasReminderSentToday } from "@/lib/db/reminders";
import { formatDate, formatMoney } from "@/lib/format";
import { sendTelegramMessage } from "@/lib/telegram";

const REMINDER_WINDOW_DAYS = 1; // due tomorrow or already overdue
const CHANNEL = "telegram";
const SCHEDULE = process.env.REMINDER_CRON_SCHEDULE ?? "0 9 * * *"; // 09:00 daily

function buildMessage(debt: Awaited<ReturnType<typeof findDebtsNeedingReminder>>[number]) {
  const remaining = Number(debt.amount) - Number(debt.paidAmount);
  const isOverdue = debt.dueDate ? debt.dueDate < new Date() : false;
  const lines = [
    `"${debt.customer.shop.name}" tomonidan qarz eslatmasi.`,
    debt.description ? `Tovar/xizmat: ${debt.description}` : null,
    `Qoldiq: ${formatMoney(remaining)}`,
    debt.dueDate
      ? `${isOverdue ? "Muddati o'tgan" : "To'lov muddati"}: ${formatDate(debt.dueDate)}`
      : null,
  ];
  return lines.filter(Boolean).join("\n");
}

export async function runReminderJob() {
  const debts = await findDebtsNeedingReminder(REMINDER_WINDOW_DAYS);
  let sent = 0;
  let skipped = 0;

  for (const debt of debts) {
    const alreadySentToday = await wasReminderSentToday(debt.id, CHANNEL);
    if (alreadySentToday) {
      skipped++;
      continue;
    }

    try {
      await sendTelegramMessage(debt.customer.telegramChatId!, buildMessage(debt));
      await logReminder(debt.id, CHANNEL, "sent");
      sent++;
    } catch (error) {
      await logReminder(debt.id, CHANNEL, "failed");
      console.error(`Failed to send reminder for debt ${debt.id}:`, error);
    }
  }

  console.log(
    `[reminder-cron] ${new Date().toISOString()} — sent ${sent}, skipped ${skipped} (already sent today), ${debts.length} eligible`
  );
}

if (process.env.RUN_ONCE === "true") {
  runReminderJob()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  console.log(`[reminder-cron] scheduled: "${SCHEDULE}"`);
  cron.schedule(SCHEDULE, () => {
    runReminderJob().catch((error) => console.error("[reminder-cron] job error:", error));
  });
}
