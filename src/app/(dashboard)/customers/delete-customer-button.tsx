"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteCustomerAction } from "./actions";

export function DeleteCustomerButton({
  customerId,
  customerName,
  redirectTo,
}: {
  customerId: string;
  customerName: string;
  redirectTo?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            `"${customerName}" mijozni o'chirishni tasdiqlaysizmi? Barcha qarz va to'lov tarixi ham o'chib ketadi.`
          )
        ) {
          return;
        }
        startTransition(async () => {
          const result = await deleteCustomerAction(customerId);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          if (redirectTo) {
            router.push(redirectTo);
          }
        });
      }}
    >
      {isPending ? "O'chirilmoqda..." : "O'chirish"}
    </Button>
  );
}
