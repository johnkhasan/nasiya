import { Badge } from "@/components/ui/badge";
import { DEBT_STATUS, type DebtStatus } from "@/lib/db/debts";

const LABELS: Record<DebtStatus, string> = {
  [DEBT_STATUS.OPEN]: "Ochiq",
  [DEBT_STATUS.PARTIALLY_PAID]: "Qisman to'langan",
  [DEBT_STATUS.PAID]: "To'langan",
};

const CLASSES: Record<DebtStatus, string> = {
  [DEBT_STATUS.OPEN]:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  [DEBT_STATUS.PARTIALLY_PAID]:
    "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  [DEBT_STATUS.PAID]:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
};

export function DebtStatusBadge({ status }: { status: string }) {
  const key = (status in LABELS ? status : DEBT_STATUS.OPEN) as DebtStatus;
  return (
    <Badge className={CLASSES[key]} variant="outline">
      {LABELS[key]}
    </Badge>
  );
}
