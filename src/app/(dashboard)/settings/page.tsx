import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { listUsersByShop } from "@/lib/db/users";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StaffFormDialog } from "./staff-form-dialog";
import { DeleteStaffButton } from "./delete-staff-button";

export const metadata: Metadata = {
  title: "Sozlamalar — Nasiya",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Do'kon egasi",
  staff: "Xodim",
};

export default async function SettingsPage() {
  const { shopId, role } = await requireSession();
  if (role !== "owner") {
    redirect("/dashboard");
  }

  const users = await listUsersByShop(shopId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Xodimlar</h1>
          <p className="text-muted-foreground">
            Xodimlar mijoz va qarz qo&apos;sha oladi, lekin o&apos;chira olmaydi.
          </p>
        </div>
        <StaffFormDialog />
      </div>

      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between gap-2 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.fullName}</p>
                  <Badge variant={user.role === "owner" ? "default" : "outline"}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.phone} — {formatDate(user.createdAt)} dan beri
                </p>
              </div>
              {user.role === "staff" ? (
                <DeleteStaffButton staffUserId={user.id} staffName={user.fullName} />
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
