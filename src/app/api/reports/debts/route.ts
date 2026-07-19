import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { listDebts } from "@/lib/db/debts";
import { requireShopId } from "@/lib/session";

const STATUS_LABELS: Record<string, string> = {
  open: "Ochiq",
  partially_paid: "Qisman to'langan",
  paid: "To'langan",
};

export async function GET() {
  let shopId: string;
  try {
    shopId = await requireShopId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const debts = await listDebts(shopId);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Qarzlar");

  sheet.columns = [
    { header: "Mijoz", key: "customer", width: 28 },
    { header: "Telefon", key: "phone", width: 18 },
    { header: "Summa", key: "amount", width: 16 },
    { header: "To'langan", key: "paid", width: 16 },
    { header: "Qoldiq", key: "remaining", width: 16 },
    { header: "Holat", key: "status", width: 18 },
    { header: "Tavsif", key: "description", width: 28 },
    { header: "Muddat", key: "dueDate", width: 14 },
    { header: "Yaratilgan sana", key: "createdAt", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const debt of debts) {
    const amount = Number(debt.amount);
    const paid = Number(debt.paidAmount);
    sheet.addRow({
      customer: debt.customer.fullName,
      phone: debt.customer.phone,
      amount,
      paid,
      remaining: amount - paid,
      status: STATUS_LABELS[debt.status] ?? debt.status,
      description: debt.description ?? "",
      dueDate: debt.dueDate ? debt.dueDate.toLocaleDateString("uz-UZ") : "",
      createdAt: debt.createdAt.toLocaleDateString("uz-UZ"),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="qarzlar-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
