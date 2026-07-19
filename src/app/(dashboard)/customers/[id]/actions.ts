"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createDebt } from "@/lib/db/debts";
import { requireShopId } from "@/lib/session";

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
  const shopId = await requireShopId();

  const parsed = debtSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlarni tekshiring" };
  }

  try {
    await createDebt(shopId, {
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

  revalidatePath(`/customers/${customerId}`);
  return { success: true };
}
