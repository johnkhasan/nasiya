import Link from "next/link";
import type { Metadata } from "next";
import {
  LayoutDashboard,
  Send,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingHeader } from "@/components/marketing-header";

export const metadata: Metadata = {
  title: "Nasiya — Nasiya/qarz kuzatuv tizimi",
  description:
    "Kichik do'konlar uchun mijozlarga nasiyaga sotilgan tovarlarni, qarz holatini va to'lov eslatmalarini boshqarish tizimi.",
};

const FEATURES: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Mijozlar va qarzlar",
    description:
      "Har bir mijozning to'liq tarixi — qarzlar, to'lovlar, qoldiq — bir joyda.",
    icon: Users,
  },
  {
    title: "Telegram eslatma",
    description:
      "Mijozga muddati yaqinlashgan yoki o'tgan qarz haqida avtomatik xabar boradi.",
    icon: Send,
  },
  {
    title: "Dashboard statistikasi",
    description:
      "Jami qarzdorlik, muddati o'tganlar va eng ko'p qarzdor mijozlar bir qarashda.",
    icon: LayoutDashboard,
  },
  {
    title: "Mobil-first",
    description:
      "Telefondan qulay foydalanish uchun mo'ljallangan — do'konchi doim yo'lda.",
    icon: Smartphone,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <MarketingHeader />

      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Nasiya savdosini daftarda emas, telefoningizda yuriting
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            Mijozlaringiz kimga qancha qarzdorligini, qachon to&apos;lashi
            kerakligini kuzating — va ularga avtomatik Telegram orqali
            eslatma yuboring.
          </p>
          <div className="mt-3 flex gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/register">30 kun bepul boshlash</Link>}
            />
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/pricing">Narxlarni ko&apos;rish</Link>}
            />
          </div>
        </div>

        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-4.5" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {feature.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
