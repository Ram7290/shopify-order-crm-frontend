import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Mail, Package, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { api, ApiError } from '../../lib/api';
import { formatDate, formatMoney } from '../../lib/format';
import { fulfillmentClass, paymentClass, prettify } from '../../lib/status';
import { OrderDetail } from '../../types';

function InfoRow({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100">
        <Icon className="size-4 text-slate-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="truncate text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Amount({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between text-sm', strong && 'border-t pt-3 text-base font-semibold')}>
      <span className={strong ? 'text-slate-900' : 'text-slate-500'}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<OrderDetail>(`/orders/${id}`)
      .then(setOrder)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load the order'));
  }, [id]);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!order)
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-slate-600">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to orders
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">Order {order.orderNumber}</h1>
              <Badge variant="outline" className="border-0 bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20">
                {order.source === 'CRM' ? 'Created in CRM' : 'From Shopify'}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn('border-0 ring-1 ring-inset', paymentClass(order.financialStatus))}>
                {prettify(order.financialStatus)}
              </Badge>
              <Badge variant="outline" className={cn('border-0 ring-1 ring-inset', fulfillmentClass(order.fulfillmentStatus))}>
                {prettify(order.fulfillmentStatus)}
              </Badge>
            </div>
          </div>
          <p className="text-3xl font-semibold tabular-nums">{formatMoney(order.totalPrice, order.currency)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-5 p-6">
          <h2 className="text-sm font-semibold">Customer</h2>
          <InfoRow icon={User} label="Name" value={order.customerName ?? 'Not available'} />
          <InfoRow icon={Mail} label="Email" value={order.customerEmail ?? 'Not available'} />
        </Card>
        <Card className="space-y-5 p-6">
          <h2 className="text-sm font-semibold">Order</h2>
          <InfoRow icon={Calendar} label="Date" value={formatDate(order.orderDate)} />
          <InfoRow icon={Package} label="Items" value={`${order.items.reduce((n, i) => n + i.quantity, 0)} units`} />
        </Card>
        <Card className="space-y-3 p-6">
          <h2 className="text-sm font-semibold">Summary</h2>
          <Amount label="Subtotal" value={formatMoney(order.subtotalPrice, order.currency)} />
          <Amount label="Total" value={formatMoney(order.totalPrice, order.currency)} strong />
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold">Items</h2>
        </div>
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="pr-6 text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="pl-6 font-medium">{item.title}</TableCell>
                <TableCell className="text-slate-500">{item.sku ?? 'Not available'}</TableCell>
                <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(item.unitPrice, order.currency)}</TableCell>
                <TableCell className="pr-6 text-right font-medium tabular-nums">
                  {formatMoney(item.lineTotal, order.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
