"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "@/lib/db/customers";
import { requireShopId } from "@/lib/session";

const customerSchema = z.object({
  fullName: z.string().min(2, "Ism kiriting"),
  phone: z.string().min(9, "Telefon raqamni to'liq kiriting"),
  note: z.string().optional(),
});

export type CustomerFormState = { error?: string; success?: boolean };

function parseCustomerForm(formData: FormData) {
  return customerSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    note: formData.get("note") || undefined,
  });
}

export async function createCustomerAction(
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const shopId = await requireShopId();

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlarni tekshiring" };
  }

  await createCustomer(shopId, parsed.data);
  revalidatePath("/customers");
  return { success: true };
}

export async function updateCustomerAction(
  id: string,
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const shopId = await requireShopId();

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlarni tekshiring" };
  }

  const updated = await updateCustomer(shopId, id, parsed.data);
  if (!updated) {
    return { error: "Mijoz topilmadi" };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true };
}

export async function deleteCustomerAction(id: string) {
  const shopId = await requireShopId();
  await deleteCustomer(shopId, id);
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}
