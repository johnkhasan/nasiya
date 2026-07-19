import Link from "next/link";
import { auth } from "@/lib/auth";
import { countCustomers } from "@/lib/db/customers";
import { getDashboardStats } from "@/lib/db/dashboard";
import { getShopById } from "@/lib/db/shops";
import { formatMoney } from "@/lib/format";
import { getCustomerLimit, PLAN_LABELS } from "@/lib/plans";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopDebtorsChart } from "@/components/top-debtors-chart";

export default async function DashboardPage() {
  const session = await auth();
  const shopId = session?.user.shopId;

  const [shop, stats, customerCount] = shopId
    ? await Promise.all([
        getShopById(shopId),
        getDashboardStats(shopId),
        countCustomers(shopId),
      ])
    : [null, null, 0];

  const customerLimit = getCustomerLimit(shop?.plan ?? "trial");
  const isNearLimit = customerCount / customerLimit >= 0.8;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{shop?.name ?? "Dashboard"}</h1>
          <p className="text-muted-foreground">
            Xush kelibsiz, {session?.user.name}
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href="/api/reports/debts">Excel yuklab olish</a>}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Jami qarzdorlik</CardDescription>
            <CardTitle className="text-2xl">
              {formatMoney(stats?.totalOutstanding ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Muddati o&apos;tgan</CardDescription>
            <CardTitle className="text-2xl">
              {formatMoney(stats?.overdueAmount ?? 0)}
            </CardTitle>
            <CardDescription>{stats?.overdueCount ?? 0} ta qarz</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Bugungi to&apos;lovlar</CardDescription>
            <CardTitle className="text-2xl">
              {formatMoney(stats?.todayPaymentsTotal ?? 0)}
            </CardTitle>
            <CardDescription>
              {stats?.todayPaymentsCount ?? 0} ta to&apos;lov
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Ochiq qarzlar soni</CardDescription>
            <CardTitle className="text-2xl">
              {stats?.openDebtCount ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top qarzdorlar</CardTitle>
          <CardDescription>
            Eng ko&apos;p qarzdorlik bo&apos;lgan mijozlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats && stats.topDebtors.length > 0 ? (
            <TopDebtorsChart data={stats.topDebtors} />
          ) : (
            <p className="py-6 text-center text-muted-foreground">
              Hozircha qarzdorlik yo&apos;q
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Tarif</CardTitle>
          <CardDescription>
            {PLAN_LABELS[shop?.plan ?? "trial"] ?? shop?.plan}
            {shop?.planExpiresAt
              ? ` — ${shop.planExpiresAt.toLocaleDateString("uz-UZ")} gacha`
              : ""}
          </CardDescription>
          <CardDescription>
            Mijozlar: {customerCount} /{" "}
            {customerLimit === Infinity ? "cheksiz" : customerLimit}
          </CardDescription>
        </CardHeader>
        {isNearLimit ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mijozlar chegarasiga yaqinlashyapsiz.{" "}
              <Link href="/pricing" className="font-medium underline">
                Tarifni oshiring
              </Link>
              .
            </p>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
