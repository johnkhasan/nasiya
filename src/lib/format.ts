export function formatMoney(value: { toString(): string } | number | string): string {
  const num = Number(typeof value === "object" ? value.toString() : value);
  return `${new Intl.NumberFormat("uz-UZ").format(num)} so'm`;
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("uz-UZ");
}
