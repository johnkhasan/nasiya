import { webhookCallback } from "grammy";
import { NextResponse } from "next/server";
import { getBot } from "@/lib/telegram";

export async function POST(req: Request) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 503 });
  }

  const bot = await getBot();
  const handler = webhookCallback(bot, "std/http", {
    secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
  });
  return handler(req);
}
