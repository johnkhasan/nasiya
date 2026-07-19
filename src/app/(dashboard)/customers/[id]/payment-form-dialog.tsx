"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format";
import { createPaymentAction } from "./actions";

export function PaymentFormDialog({
  customerId,
  debtId,
  remaining,
}: {
  customerId: string;
  debtId: string;
  remaining: number;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  // Snapshotted only when the dialog opens — see the same fix in
  // customer-form-dialog.tsx for why `remaining` can't be used directly as
  // the mounted input's defaultValue.
  const [formRemaining, setFormRemaining] = useState(remaining);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createPaymentAction(
        customerId,
        debtId,
        {},
        formData
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setError(undefined);
          setFormRemaining(remaining);
        }
      }}
    >
      <DialogTrigger render={<Button size="sm">To&apos;lov qabul qilish</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>To&apos;lov qabul qilish</DialogTitle>
          <DialogDescription>
            Qoldiq: {formatMoney(formRemaining)}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Summa (so&apos;m)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              min="0"
              max={formRemaining}
              step="0.01"
              defaultValue={formRemaining}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="note">Izoh</Label>
            <Input id="note" name="note" placeholder="Ixtiyoriy" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
