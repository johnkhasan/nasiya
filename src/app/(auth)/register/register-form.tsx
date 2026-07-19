"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { PhoneInput } from "@/components/phone-input";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );
  const [mismatchError, setMismatchError] = useState<string | undefined>();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    if (formData.get("password") !== formData.get("confirmPassword")) {
      // Block the submit before it reaches the form action, so the browser
      // never sees a "submitted" password form to offer saving on mismatch.
      event.preventDefault();
      setMismatchError("Parollar mos emas");
      return;
    }
    setMismatchError(undefined);
  }

  const errorMessage = mismatchError ?? state.error;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Ro&apos;yxatdan o&apos;tish</CardTitle>
        <CardDescription>
          30 kunlik bepul sinov muddati bilan boshlang
        </CardDescription>
      </CardHeader>
      <form action={formAction} onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="shopName">Do&apos;kon nomi</Label>
            <Input id="shopName" name="shopName" placeholder="Aziz Market" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ownerName">F.I.Sh.</Label>
            <Input id="ownerName" name="ownerName" placeholder="Aziz Azizov" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <PhoneInput id="phone" name="phone" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Parol</Label>
            <PasswordInput id="password" name="password" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
            <PasswordInput id="confirmPassword" name="confirmPassword" required />
          </div>
          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Hisobingiz bormi?{" "}
            <Link href="/login" className="font-medium text-foreground underline">
              Kiring
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
