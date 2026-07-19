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
import { PhoneInput } from "@/components/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { createCustomerAction, updateCustomerAction } from "./actions";

type Customer = {
  id: string;
  fullName: string;
  phone: string;
  note: string | null;
};

type CustomerFormDialogProps = {
  customer?: Customer;
  trigger: React.ReactElement;
};

export function CustomerFormDialog({
  customer,
  trigger,
}: CustomerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  // Snapshotted only when the dialog opens, so the mounted <Input>s' initial
  // values never change under them while open (Base UI warns/misbehaves if
  // an uncontrolled field's defaultValue changes after mount — which would
  // otherwise happen here once our own save revalidates the page).
  const [formValues, setFormValues] = useState<Customer | undefined>(customer);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = customer
        ? await updateCustomerAction(customer.id, {}, formData)
        : await createCustomerAction({}, formData);

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
          setFormValues(customer);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {customer ? "Mijozni tahrirlash" : "Yangi mijoz"}
          </DialogTitle>
          <DialogDescription>
            Mijoz ma&apos;lumotlarini kiriting
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">F.I.Sh.</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={formValues?.fullName}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <PhoneInput
              id="phone"
              name="phone"
              defaultValue={formValues?.phone}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="note">Izoh</Label>
            <Textarea
              id="note"
              name="note"
              defaultValue={formValues?.note ?? ""}
            />
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
