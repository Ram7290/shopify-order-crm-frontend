import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Inbox, Loader2, Plus, RefreshCw, Search, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { api, ApiError } from '../../lib/api';
import { formatDate, formatMoney } from '../../lib/format';
import { fulfillmentClass, paymentClass, prettify } from '../../lib/status';
import { cn } from '@/lib/utils';
import { OrderListResponse, ShopifyStatus, SyncSummary } from '../../types';

const STATUSES = ['PENDING', 'AUTHORIZED', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'PARTIALLY_REFUNDED', 'VOIDED'];
const PAGE_SIZE = 20;

export function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<OrderListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shopify, setShopify] = useState<ShopifyStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [shopInput, setShopInput] = useState('');

  const page = Number(params.get('page') ?? 1);
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const startDate = params.get('startDate') ?? '';
  const endDate = params.get('endDate') ?? '';
  const sortBy = params.get('sortBy') ?? 'orderDate';
  const sortOrder = params.get('sortOrder') ?? 'desc';

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sortBy, sortOrder });
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);

    setLoading(true);
    setError(null);
    api<OrderListResponse>(`/orders?${query.toString()}`)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load orders'))
      .finally(() => setLoading(false));
  }, [page, search, status, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    api<ShopifyStatus>('/shopify/status')
      .then(setShopify)
      .catch(() => setShopify({ connected: false }));
  }, []);

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!('page' in changes)) next.set('page', '1');
    setParams(next);
  }

  async function runSync() {
    setSyncMessage(null);
    setSyncing(true);
    try {
      const summary = await api<SyncSummary>('/orders/sync', { method: 'POST' });
      setSyncMessage(
        `Synced ${summary.fetched} orders: ${summary.created} new, ${summary.updated} updated, ${summary.failed} failed.`,
      );
      update({ page: '1' });
    } catch (err) {
      setSyncMessage(err instanceof ApiError ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  function connectStore(event: FormEvent) {
    event.preventDefault();
    const shop = shopInput.trim();
    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
    window.location.href = `${base}/shopify/install?shop=${encodeURIComponent(shop)}`;
  }

  const hasFilters = Boolean(search || status || startDate || endDate);
  const total = result?.pagination.total ?? 0;

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-slate-500">
            {shopify?.connected ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                Connected to {shopify.shopDomain}
              </span>
            ) : (
              'Connect a Shopify store to start importing orders.'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runSync} disabled={!shopify?.connected || syncing} className="bg-white">
            {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {syncing ? 'Syncing…' : 'Sync from Shopify'}
          </Button>
          <Button asChild>
            <Link to="/orders/new">
              <Plus className="size-4" />
              Create order
            </Link>
          </Button>
        </div>
      </div>

      {shopify && !shopify.connected && (
        <Card className="border-dashed p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Store className="size-5 text-slate-600" />
            </div>
            <form className="flex flex-1 flex-col gap-3 sm:flex-row" onSubmit={connectStore}>
              <Input
                className="bg-white sm:max-w-sm"
                placeholder="yourstore.myshopify.com"
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
                required
              />
              <Button type="submit">Connect store</Button>
            </form>
          </div>
        </Card>
      )}

      {syncMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {syncMessage}
        </div>
      )}

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search order number or customer"
              defaultValue={search}
              key={search}
              className="bg-white pl-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter') update({ search: (e.target as HTMLInputElement).value.trim() });
              }}
              onBlur={(e) => update({ search: e.target.value.trim() })}
            />
          </div>
          <Select value={status || 'all'} onValueChange={(v) => update({ status: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payment statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {prettify(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" aria-label="From date" value={startDate} className="bg-white" onChange={(e) => update({ startDate: e.target.value })} />
          <Input type="date" aria-label="To date" value={endDate} className="bg-white" onChange={(e) => update({ endDate: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={sortBy} onValueChange={(v) => update({ sortBy: v })}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orderDate">Sort: Date</SelectItem>
                <SelectItem value="totalPrice">Sort: Total</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v) => update({ sortOrder: v })}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest / highest</SelectItem>
                <SelectItem value="asc">Oldest / lowest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasFilters && (
          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <span>{total} matching orders</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParams(new URLSearchParams())}
              className="h-7 text-slate-600"
            >
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="pr-6">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j} className={cn(j === 0 && 'pl-6', j === 6 && 'pr-6')}>
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && result?.data.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
                      <Inbox className="size-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium">No orders found</p>
                      <p className="text-sm text-slate-500">
                        {hasFilters ? 'Try a different filter or search term.' : 'Sync from Shopify or create your first order.'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              result?.data.map((order) => (
                <TableRow key={order.id} className="group">
                  <TableCell className="pl-6 font-medium">
                    <Link to={`/orders/${order.id}`} className="text-slate-900 underline-offset-4 group-hover:underline">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">{formatDate(order.orderDate)}</TableCell>
                  <TableCell>{order.customerName ?? <span className="text-slate-400">Not available</span>}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-0 ring-1 ring-inset', paymentClass(order.financialStatus))}>
                      {prettify(order.financialStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-0 ring-1 ring-inset', fulfillmentClass(order.fulfillmentStatus))}>
                      {prettify(order.fulfillmentStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(order.totalPrice, order.currency)}
                  </TableCell>
                  <TableCell className="pr-6">
                    <span className="text-xs font-medium text-slate-500">
                      {order.source === 'CRM' ? 'Created in CRM' : 'Shopify'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {result && result.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <span className="text-sm text-slate-500">
              Page {page} of {result.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page <= 1}
                    onClick={() => update({ page: String(page - 1) })}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous page</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page >= result.pagination.totalPages}
                    onClick={() => update({ page: String(page + 1) })}
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next page</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
