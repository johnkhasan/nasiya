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
import { Textarea } from "@/components/ui/textarea";
import { createDebtAction } from "./actions";

export function DebtFormDialog({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createDebtAction(customerId, {}, formData);
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
        if (nextOpen) setError(undefined);
      }}
    >
      <DialogTrigger render={<Button>+ Yangi qarz</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi qarz</DialogTitle>
          <DialogDescription>
            Mijozga nasiyaga berilgan tovar/xizmat ma&apos;lumotlarini kiriting
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
              step="0.01"
              placeholder="150000"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Tavsif</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Masalan: Televizor"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">To&apos;lov muddati</Label>
            <Input id="dueDate" name="dueDate" type="date" />
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
