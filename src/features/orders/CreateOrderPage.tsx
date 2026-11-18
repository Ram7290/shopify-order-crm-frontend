import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <section>
      <div className="page-header">
        <h1>Create order</h1>
      </div>
      <form className="card form" onSubmit={submit}>
        <h2>Customer</h2>
        <div className="grid">
          <label>
            Email
            <input type="email" required value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
          </label>
          <label>
            Phone (optional)
            <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
          </label>
          <label>
            First name
            <input required value={customer.firstName} onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })} />
          </label>
          <label>
            Last name
            <input required value={customer.lastName} onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })} />
          </label>
        </div>

        <h2>Products</h2>
        {lineItems.map((item, index) => (
          <div className="line-item" key={index}>
            <label>
              Shopify variant ID
              <input
                required
                placeholder="e.g. 44123456789012"
                value={item.variantId}
                onChange={(e) => updateLine(index, { variantId: e.target.value })}
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={item.quantity}
                onChange={(e) => updateLine(index, { quantity: e.target.value })}
              />
            </label>
            {lineItems.length > 1 && (
              <button
                type="button"
                className="secondary"
                onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" className="secondary" onClick={() => setLineItems([...lineItems, { variantId: '', quantity: '1' }])}>
          Add product
        </button>

        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating in Shopify…' : 'Create order in Shopify'}
          </button>
        </div>
        <p className="muted">
          The order is saved here only after Shopify confirms it. Only existing product variants can be added.
        </p>
      </form>
    </section>
  );
}
