import Link from "next/link";
import type { Metadata } from "next";
import { listCustomers } from "@/lib/db/customers";
import { requireShopId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerFormDialog } from "./customer-form-dialog";

export const metadata: Metadata = {
  title: "Mijozlar — Nasiya",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const shopId = await requireShopId();
  const customers = await listCustomers(shopId, q);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Mijozlar</h1>
        <CustomerFormDialog trigger={<Button>+ Yangi mijoz</Button>} />
      </div>

      <form className="flex gap-2">
        <Input
          name="q"
          placeholder="Ism yoki telefon bo'yicha qidirish"
          defaultValue={q ?? ""}
        />
        <Button type="submit" variant="secondary">
          Qidirish
        </Button>
      </form>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {q ? "Hech narsa topilmadi" : "Hali mijozlar yo'q"}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {customers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{customer.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.phone}
                    </p>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
