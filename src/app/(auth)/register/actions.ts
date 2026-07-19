"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { PhoneAlreadyRegisteredError, registerShop } from "@/lib/db/shops";
import { phoneSchema } from "@/lib/validation";

const registerSchema = z.object({
  shopName: z.string().min(2, "Do'kon nomini kiriting"),
  ownerName: z.string().min(2, "F.I.Sh. kiriting"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export type RegisterState = { error?: string };

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    shopName: formData.get("shopName"),
    ownerName: formData.get("ownerName"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlarni tekshiring" };
  }

  try {
    await registerShop(parsed.data);
  } catch (error) {
    if (error instanceof PhoneAlreadyRegisteredError) {
      redirect(
        `/login?notice=exists&phone=${encodeURIComponent(parsed.data.phone)}`
      );
    }
    return {
      error: error instanceof Error ? error.message : "Ro'yxatdan o'tishda xatolik yuz berdi",
    };
  }

  try {
    await signIn("credentials", {
      phone: parsed.data.phone,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Ro'yxatdan o'tdingiz, lekin kirishda xatolik yuz berdi. Iltimos, kiring." };
    }
    throw error;
  }

  return {};
}
