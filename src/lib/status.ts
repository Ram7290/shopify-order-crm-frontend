const PAYMENT: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  AUTHORIZED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  PARTIALLY_PAID: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  REFUNDED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  PARTIALLY_REFUNDED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  VOIDED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

const FULFILLMENT: Record<string, string> = {
  FULFILLED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  UNFULFILLED: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  PARTIALLY_FULFILLED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

const FALLBACK = 'bg-slate-100 text-slate-600 ring-slate-500/20';

export function paymentClass(status: string | null): string {
  return (status && PAYMENT[status]) || FALLBACK;
}

export function fulfillmentClass(status: string | null): string {
  return (status && FULFILLMENT[status]) || FALLBACK;
}

export function prettify(status: string | null): string {
  if (!status) return 'Not available';
  return status.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
