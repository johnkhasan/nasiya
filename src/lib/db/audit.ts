import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "customer.create"
  | "customer.update"
  | "customer.delete"
  | "debt.create"
  | "payment.create";

export function logAudit(params: {
  shopId: string;
  userId: string;
  action: AuditAction;
  entityId?: string;
  meta?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      shopId: params.shopId,
      userId: params.userId,
      action: params.action,
      entityId: params.entityId,
      meta: params.meta,
    },
  });
}
