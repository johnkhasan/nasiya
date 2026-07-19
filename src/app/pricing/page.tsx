import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MarketingHeader } from "@/components/marketing-header";
import { formatMoney } from "@/lib/format";
import { PRICING_TIERS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Narxlar — Nasiya",
};

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <MarketingHeader />

      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-6">
        <div className="flex max-w-xl flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold">Narxlar</h1>
          <p className="text-muted-foreground">
            Do&apos;koningiz kattaligiga qarab tarifni tanlang. Har doim
            keyinroq oshirish mumkin.
          </p>
        </div>

        <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <Card key={tier.plan} className="flex flex-col">
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.customerLimit}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="text-2xl font-semibold">
                  {tier.price === 0 ? "Bepul" : `${formatMoney(tier.price)}/oy`}
                </p>
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {tier.features.map((feature) => (
                    <li key={feature}>· {feature}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.plan === "basic" ? "default" : "outline"}
                  nativeButton={false}
                  render={<Link href="/register">Boshlash</Link>}
                />
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Payme/Click orqali onlayn to&apos;lov tez orada qo&apos;shiladi —
          hozircha tarif o&apos;zgartirish uchun biz bilan bog&apos;laning.
        </p>
      </main>
    </div>
  );
}
