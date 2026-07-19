"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/db/audit";
import { createStaffUser, deleteStaffUser } from "@/lib/db/users";
import { requireOwner } from "@/lib/session";
import { phoneSchema } from "@/lib/validation";

const staffSchema = z.object({
  fullName: z.string().min(2, "Ism kiriting"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export type StaffFormState = { error?: string; success?: boolean };

export async function createStaffAction(
  _prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  const { shopId, userId } = await requireOwner();

  const parsed = staffSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlarni tekshiring" };
  }

  let staff;
  try {
    staff = await createStaffUser(shopId, parsed.data);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Xatolik yuz berdi",
    };
  }
  await logAudit({
    shopId,
    userId,
    action: "staff.create",
    entityId: staff.id,
  });

  revalidatePath("/settings");
  return { success: true };
}

export type DeleteStaffState = { error?: string };

export async function deleteStaffAction(
  staffUserId: string
): Promise<DeleteStaffState> {
  const { shopId, userId } = await requireOwner();
  const deleted = await deleteStaffUser(shopId, staffUserId);
  if (!deleted) {
    return { error: "Xodim topilmadi" };
  }
  await logAudit({
    shopId,
    userId,
    action: "staff.delete",
    entityId: staffUserId,
  });
  revalidatePath("/settings");
  return {};
}
