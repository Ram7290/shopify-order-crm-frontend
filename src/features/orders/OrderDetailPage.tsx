import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { formatDate, formatMoney } from '../../lib/format';
import { OrderDetail } from '../../types';

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<OrderDetail>(`/orders/${id}`)
      .then(setOrder)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load the order'));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!order) return <p className="muted">Loading…</p>;

  return (
    <section>
      <Link to="/">← Back to orders</Link>
      <div className="page-header">
        <h1>Order {order.orderNumber}</h1>
        <span className="badge">{order.source === 'CRM' ? 'Created in CRM' : 'From Shopify'}</span>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Summary</h2>
          <dl>
            <dt>Date</dt>
            <dd>{formatDate(order.orderDate)}</dd>
            <dt>Payment status</dt>
            <dd>{order.financialStatus ?? 'Not available'}</dd>
            <dt>Fulfillment status</dt>
            <dd>{order.fulfillmentStatus ?? 'Not available'}</dd>
            <dt>Subtotal</dt>
            <dd>{formatMoney(order.subtotalPrice, order.currency)}</dd>
            <dt>Total</dt>
            <dd>{formatMoney(order.totalPrice, order.currency)}</dd>
          </dl>
        </div>
        <div className="card">
          <h2>Customer</h2>
          <dl>
            <dt>Name</dt>
            <dd>{order.customerName ?? 'Not available'}</dd>
            <dt>Email</dt>
            <dd>{order.customerEmail ?? 'Not available'}</dd>
          </dl>
        </div>
      </div>

      <div className="card table-wrap">
        <h2>Items</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th className="right">Qty</th>
              <th className="right">Unit price</th>
              <th className="right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.sku ?? 'Not available'}</td>
                <td className="right">{item.quantity}</td>
                <td className="right">{formatMoney(item.unitPrice, order.currency)}</td>
                <td className="right">{formatMoney(item.lineTotal, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
