import { auth } from "@/lib/auth";
import { getShopById } from "@/lib/db/shops";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  const shop = session?.user.shopId
    ? await getShopById(session.user.shopId)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{shop?.name ?? "Dashboard"}</h1>
        <p className="text-muted-foreground">
          Xush kelibsiz, {session?.user.name}
        </p>
      </div>
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Tarif</CardTitle>
          <CardDescription>
            {shop?.plan === "trial" ? "Sinov muddati" : shop?.plan}
            {shop?.planExpiresAt
              ? ` — ${shop.planExpiresAt.toLocaleDateString("uz-UZ")} gacha`
              : ""}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
