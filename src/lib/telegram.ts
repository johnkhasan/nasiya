import { Bot, type Context } from "grammy";
import {
  getCustomerByIdUnscoped,
  setCustomerTelegramChatId,
} from "@/lib/db/customers";

let botInstance: Bot | undefined;

async function replySafely(ctx: Context, text: string) {
  // `bot.catch()` only applies to the polling (`handleUpdates`) path — the
  // webhook route calls `bot.handleUpdate()` directly, which does not
  // consult it, so a rejected `ctx.reply` here would otherwise bubble all
  // the way up into a 500 response, making Telegram retry the webhook
  // indefinitely. Any DB write already happened before this is called;
  // losing the confirmation message on a flaky API call is an acceptable
  // degradation, an unhandled 500 loop is not.
  try {
    await ctx.reply(text);
  } catch (err) {
    console.error("[telegram-bot] reply failed:", err);
  }
}

export function registerHandlers(bot: Bot) {
  bot.command("start", async (ctx) => {
    const customerId = ctx.match?.trim();
    if (!customerId) {
      await replySafely(ctx, "Salom! Do'koningiz sizga yuborgan havola orqali ulaning.");
      return;
    }

    const customer = await getCustomerByIdUnscoped(customerId);
    if (!customer) {
      await replySafely(
        ctx,
        "Havola noto'g'ri yoki eskirgan. Do'koningiz bilan bog'laning."
      );
      return;
    }

    await setCustomerTelegramChatId(customer.id, String(ctx.chat.id));
    await replySafely(
      ctx,
      `Assalomu alaykum, ${customer.fullName}! Siz "${customer.shop.name}" do'konining qarz eslatmalariga ulandingiz.`
    );
  });
}

export async function getBot(): Promise<Bot> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  if (!botInstance) {
    botInstance = new Bot(token);
    registerHandlers(botInstance);
  }
  if (!botInstance.isInited()) {
    await botInstance.init();
  }
  return botInstance;
}

export function getTelegramConnectLink(customerId: string): string | null {
  const username = process.env.TELEGRAM_BOT_USERNAME;
  if (!username) return null;
  return `https://t.me/${username}?start=${customerId}`;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const bot = await getBot();
  await bot.api.sendMessage(chatId, text);
}
