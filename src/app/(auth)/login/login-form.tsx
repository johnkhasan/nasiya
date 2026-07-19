"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { PhoneInput } from "@/components/phone-input";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Kirish</CardTitle>
        <CardDescription>Do&apos;koningizga kiring</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <PhoneInput id="phone" name="phone" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Parol</Label>
            <PasswordInput id="password" name="password" required />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Kirilmoqda..." : "Kirish"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Hisobingiz yo&apos;qmi?{" "}
            <Link href="/register" className="font-medium text-foreground underline">
              Ro&apos;yxatdan o&apos;ting
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
