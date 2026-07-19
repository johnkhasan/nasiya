import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomerById } from "@/lib/db/customers";
import { DEBT_STATUS } from "@/lib/db/debts";
import { requireSession, requireShopId } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DebtStatusBadge } from "@/components/debt-status-badge";
import { CustomerFormDialog } from "../customer-form-dialog";
import { DeleteCustomerButton } from "../delete-customer-button";
import { getTelegramConnectLink } from "@/lib/telegram";
import { DebtFormDialog } from "./debt-form-dialog";
import { PaymentFormDialog } from "./payment-form-dialog";
import { TelegramConnect } from "./telegram-connect";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shopId = await requireShopId();
  const customer = await getCustomerById(shopId, id);
  return {
    title: customer ? `${customer.fullName} — Nasiya` : "Mijoz — Nasiya",
  };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { shopId, role } = await requireSession();
  const customer = await getCustomerById(shopId, id);

  if (!customer) {
    notFound();
  }

  const totalOutstanding = customer.debts.reduce((sum, debt) => {
    const remaining = Number(debt.amount) - Number(debt.paidAmount);
    return sum + Math.max(remaining, 0);
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/customers" className="text-sm text-muted-foreground">
        ← Mijozlar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{customer.fullName}</h1>
          <p className="text-muted-foreground">{customer.phone}</p>
          {customer.note ? (
            <p className="mt-1 text-sm text-muted-foreground">{customer.note}</p>
          ) : null}
          <div className="mt-2">
            <TelegramConnect
              connected={!!customer.telegramChatId}
              link={getTelegramConnectLink(customer.id)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <CustomerFormDialog
            customer={{
              id: customer.id,
              fullName: customer.fullName,
              phone: customer.phone,
              note: customer.note,
            }}
            trigger={
              <Button variant="outline" size="sm">
                Tahrirlash
              </Button>
            }
          />
          {role === "owner" ? (
            <DeleteCustomerButton
              customerId={customer.id}
              customerName={customer.fullName}
              redirectTo="/customers"
            />
          ) : null}
        </div>
      </div>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Jami qarzdorlik</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold">{formatMoney(totalOutstanding)}</p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Qarzlar</h2>
        <DebtFormDialog customerId={customer.id} />
      </div>

      {customer.debts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Hali qarz yo&apos;q
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {customer.debts.map((debt) => {
            const remaining = Number(debt.amount) - Number(debt.paidAmount);

            return (
              <Card key={debt.id}>
                <CardContent className="flex flex-col gap-3 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{formatMoney(debt.amount)}</p>
                      {debt.description ? (
                        <p className="text-sm text-muted-foreground">
                          {debt.description}
                        </p>
                      ) : null}
                    </div>
                    <DebtStatusBadge status={debt.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span>To&apos;langan: {formatMoney(debt.paidAmount)}</span>
                    <span>Qoldiq: {formatMoney(remaining)}</span>
                    {debt.dueDate ? (
                      <span>Muddat: {formatDate(debt.dueDate)}</span>
                    ) : null}
                    <span>Sana: {formatDate(debt.createdAt)}</span>
                  </div>
                  {debt.status !== DEBT_STATUS.PAID ? (
                    <div>
                      <PaymentFormDialog
                        customerId={customer.id}
                        debtId={debt.id}
                        remaining={remaining}
                      />
                    </div>
                  ) : null}
                  {debt.payments.length > 0 ? (
                    <>
                      <Separator />
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">To&apos;lovlar tarixi</p>
                        {debt.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex justify-between text-sm text-muted-foreground"
                          >
                            <span>{formatDate(payment.paidAt)}</span>
                            <span>{formatMoney(payment.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
