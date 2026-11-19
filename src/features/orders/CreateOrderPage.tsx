import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '../../lib/api';

interface LineItemForm {
  variantId: string;
  quantity: string;
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
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create order</h1>
        <p className="text-sm text-muted-foreground">
          The order is saved here only after Shopify confirms it. Only existing product variants can be added.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products</CardTitle>
            <CardDescription>Enter the Shopify variant ID of each product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((item, index) => (
              <div className="flex items-end gap-3" key={index}>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`variant-${index}`}>Shopify variant ID</Label>
                  <Input
                    id={`variant-${index}`}
                    required
                    placeholder="e.g. 44123456789012"
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
                    value={item.quantity}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  />
                </div>
                {lineItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove product"
                    onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLineItems([...lineItems, { variantId: '', quantity: '1' }])}>
              <Plus className="size-4" />
              Add product
            </Button>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating in Shopify…' : 'Create order in Shopify'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </section>
  );
}
