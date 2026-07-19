export function formatMoney(value: { toString(): string } | number | string): string {
  const num = Number(typeof value === "object" ? value.toString() : value);
  // "en-US" grouping is identically implemented in every JS engine (unlike
  // "uz-UZ", whose separator differs between Node's and browsers' bundled
  // ICU data) — reuse its comma grouping and swap in the Uzbek space.
  const grouped = new Intl.NumberFormat("en-US").format(num).replace(/,/g, " ");
  return `${grouped} so'm`;
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("uz-UZ");
}
