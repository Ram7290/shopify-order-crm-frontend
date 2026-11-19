import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, ApiError } from '../../lib/api';
import { formatDate, formatMoney } from '../../lib/format';
import { OrderListResponse, ShopifyStatus, SyncSummary } from '../../types';

const STATUSES = ['PENDING', 'AUTHORIZED', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'PARTIALLY_REFUNDED', 'VOIDED'];

export function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<OrderListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shopify, setShopify] = useState<ShopifyStatus | null>(null);
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
    const query = new URLSearchParams({ page: String(page), pageSize: '20', sortBy, sortOrder });
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
    try {
      const summary = await api<SyncSummary>('/orders/sync', { method: 'POST' });
      setSyncMessage(
        `Imported ${summary.fetched} orders: ${summary.created} new, ${summary.updated} updated, ${summary.skipped} unchanged, ${summary.failed} failed.`,
      );
      update({ page: '1' });
    } catch (err) {
      setSyncMessage(err instanceof ApiError ? err.message : 'Sync failed');
    }
  }

  function connectStore(event: FormEvent) {
    event.preventDefault();
    const shop = shopInput.trim();
    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
    window.location.href = `${base}/shopify/install?shop=${encodeURIComponent(shop)}`;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          {shopify?.connected && (
            <p className="text-sm text-muted-foreground">Connected to {shopify.shopDomain}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/orders/new">Create order</Link>
          </Button>
          <Button variant="outline" onClick={runSync} disabled={!shopify?.connected}>
            <RefreshCw className="size-4" />
            Sync from Shopify
          </Button>
        </div>
      </div>

      {shopify && !shopify.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connect your Shopify store</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-wrap gap-2" onSubmit={connectStore}>
              <Input
                className="max-w-sm"
                placeholder="yourstore.myshopify.com"
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
                required
              />
              <Button type="submit">Connect</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {syncMessage && (
        <p className="rounded-md border bg-background px-4 py-3 text-sm">{syncMessage}</p>
      )}

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Order number or customer"
              defaultValue={search}
              key={search}
              onKeyDown={(e) => {
                if (e.key === 'Enter') update({ search: (e.target as HTMLInputElement).value.trim() });
              }}
              onBlur={(e) => update({ search: e.target.value.trim() })}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment status</Label>
            <Select value={status || 'all'} onValueChange={(v) => update({ status: v === 'all' ? '' : v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={startDate} onChange={(e) => update({ startDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={endDate} onChange={(e) => update({ endDate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:col-span-2">
            <div className="space-y-2">
              <Label>Sort by</Label>
              <Select value={sortBy} onValueChange={(v) => update({ sortBy: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orderDate">Date</SelectItem>
                  <SelectItem value="totalPrice">Total</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Select value={sortOrder} onValueChange={(v) => update({ sortOrder: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && result?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No orders found. Try another filter or sync from Shopify.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              result?.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link to={`/orders/${order.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>{order.customerName ?? 'Not available'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.financialStatus ?? 'Not available'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.fulfillmentStatus ?? 'Not available'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(order.totalPrice, order.currency)}</TableCell>
                  <TableCell>
                    <Badge>{order.source === 'CRM' ? 'CRM' : 'Shopify'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      {result && result.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {result.pagination.totalPages} ({result.pagination.total} orders)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= result.pagination.totalPages}
            onClick={() => update({ page: String(page + 1) })}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
