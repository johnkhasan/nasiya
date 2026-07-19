"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteStaffAction } from "./actions";

export function DeleteStaffButton({
  staffUserId,
  staffName,
}: {
  staffUserId: string;
  staffName: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`"${staffName}" xodimni o'chirishni tasdiqlaysizmi?`)) {
          return;
        }
        startTransition(async () => {
          const result = await deleteStaffAction(staffUserId);
          if (result.error) {
            toast.error(result.error);
          }
        });
      }}
    >
      {isPending ? "O'chirilmoqda..." : "O'chirish"}
    </Button>
  );
}
