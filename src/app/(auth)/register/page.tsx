import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish — Nasiya",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
