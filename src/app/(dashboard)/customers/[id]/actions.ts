"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/db/audit";
import { createDebt } from "@/lib/db/debts";
import { createPayment } from "@/lib/db/payments";
import { requireSession } from "@/lib/session";

const debtSchema = z.object({
  amount: z.coerce.number().positive("Summani to'g'ri kiriting"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export type DebtFormState = { error?: string; success?: boolean };

export async function createDebtAction(
  customerId: string,
  _prevState: DebtFormState,
  formData: FormData
): Promise<DebtFormState> {
  const { shopId, userId } = await requireSession();

  const parsed = debtSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlarni tekshiring" };
  }

  let debt;
  try {
    debt = await createDebt(shopId, {
      customerId,
      amount: parsed.data.amount,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Xatolik yuz berdi",
    };
  }
  await logAudit({
    shopId,
    userId,
    action: "debt.create",
    entityId: debt.id,
    meta: { amount: debt.amount.toString(), customerId },
  });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Summani to'g'ri kiriting"),
  note: z.string().optional(),
});

export type PaymentFormState = { error?: string; success?: boolean };

export async function createPaymentAction(
  customerId: string,
  debtId: string,
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const { shopId, userId } = await requireSession();

  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlarni tekshiring" };
  }

  let result;
  try {
    result = await createPayment(shopId, {
      debtId,
      amount: parsed.data.amount,
      note: parsed.data.note,
      createdBy: userId,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Xatolik yuz berdi",
    };
  }
  await logAudit({
    shopId,
    userId,
    action: "payment.create",
    entityId: result.payment.id,
    meta: { amount: result.payment.amount.toString(), debtId },
  });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
