import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Kirish — Nasiya",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; phone?: string }>;
}) {
  const { notice, phone } = await searchParams;

  return (
    <LoginForm
      notice={notice === "exists" ? "exists" : undefined}
      defaultPhone={phone}
    />
  );
}
