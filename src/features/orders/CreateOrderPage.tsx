import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, ShieldCheck, Trash2, UserRound, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { api, ApiError } from '../../lib/api';

interface LineItemForm {
  variantId: string;
  quantity: string;
}

function SectionHeader({ icon: Icon, title, description }: { icon: typeof UserRound; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
        <Icon className="size-4" />
      </div>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function CreateOrderPage() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({ email: '', firstName: '', lastName: '', phone: '' });
  const [lineItems, setLineItems] = useState<LineItemForm[]>([{ variantId: '', quantity: '1' }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateLine(index: number, changes: Partial<LineItemForm>) {
    setLineItems((items) => items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await api<{ id: string }>('/orders', {
        method: 'POST',
        body: {
          customer: { ...customer, phone: customer.phone || undefined },
          lineItems: lineItems.map((item) => ({ variantId: item.variantId.trim(), quantity: Number(item.quantity) })),
        },
      });
      navigate(`/orders/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-slate-600">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to orders
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">New order</h1>
          <p className="text-sm text-slate-500">Create an order in Shopify and save it here once Shopify confirms it.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card className="space-y-6 p-6">
          <SectionHeader icon={UserRound} title="Customer" description="Who is buying?" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="customer@example.com"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                required
                value={customer.firstName}
                onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                required
                value={customer.lastName}
                onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            </div>
          </div>
        </Card>

        <Card className="space-y-6 p-6">
          <SectionHeader
            icon={ShoppingBag}
            title="Products"
            description="Add each product by its Shopify variant ID."
          />
          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div className="flex items-end gap-3 rounded-lg border bg-slate-50/60 p-3" key={index}>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`variant-${index}`}>Variant ID</Label>
                  <Input
                    id={`variant-${index}`}
                    required
                    placeholder="e.g. 44123456789012"
                    className="bg-white"
                    value={item.variantId}
                    onChange={(e) => updateLine(index, { variantId: e.target.value })}
                  />
                </div>
                <div className="w-28 space-y-2">
                  <Label htmlFor={`qty-${index}`}>Quantity</Label>
                  <Input
                    id={`qty-${index}`}
                    type="number"
                    min={1}
                    max={1000}
                    required
                    className="bg-white"
                    value={item.quantity}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  />
                </div>
                {lineItems.length > 1 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove product"
                        className="text-slate-500 hover:text-rose-600"
                        onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove product</TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="bg-white" onClick={() => setLineItems([...lineItems, { variantId: '', quantity: '1' }])}>
            <Plus className="size-4" />
            Add another product
          </Button>
        </Card>

        {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="size-4 text-emerald-600" />
            Saved here only after Shopify confirms the order.
          </p>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? 'Creating in Shopify…' : 'Create order'}
          </Button>
        </div>
      </form>
    </section>
  );
}
