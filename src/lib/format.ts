export function formatMoney(amount: string | null, currency: string): string {
  if (amount === null) return 'Not available';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}
