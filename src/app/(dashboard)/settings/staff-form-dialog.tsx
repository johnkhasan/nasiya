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
import { createStaffAction } from "./actions";

export function StaffFormDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createStaffAction({}, formData);
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
      <DialogTrigger render={<Button>+ Xodim qo&apos;shish</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi xodim</DialogTitle>
          <DialogDescription>
            Xodim mijozlar va qarzlarni ko&apos;rishi/qo&apos;shishi mumkin, lekin
            hech narsani o&apos;chira olmaydi.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">F.I.Sh.</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <PhoneInput id="phone" name="phone" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Parol</Label>
            <Input id="password" name="password" type="password" required />
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
