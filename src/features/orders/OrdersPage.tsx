import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { OrderListResponse, ShopifyStatus, SyncSummary } from '../../types';
import { formatDate, formatMoney } from '../../lib/format';

const STATUSES = ['', 'PENDING', 'AUTHORIZED', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'PARTIALLY_REFUNDED', 'VOIDED'];

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
    <section>
      <div className="page-header">
        <h1>Orders</h1>
        <div className="actions">
          <Link to="/orders/new" className="button">
            Create order
          </Link>
          <button type="button" onClick={runSync} disabled={!shopify?.connected}>
            Sync from Shopify
          </button>
        </div>
      </div>

      {shopify && !shopify.connected && (
        <form className="card connect" onSubmit={connectStore}>
          <strong>Connect your Shopify store</strong>
          <input
            placeholder="yourstore.myshopify.com"
            value={shopInput}
            onChange={(e) => setShopInput(e.target.value)}
            required
          />
          <button type="submit">Connect</button>
        </form>
      )}
      {shopify?.connected && <p className="muted">Connected to {shopify.shopDomain}</p>}
      {syncMessage && <p className="notice">{syncMessage}</p>}

      <div className="card filters">
        <input
          placeholder="Search order number or customer"
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update({ search: (e.target as HTMLInputElement).value.trim() });
          }}
          onBlur={(e) => update({ search: e.target.value.trim() })}
        />
        <select value={status} onChange={(e) => update({ status: e.target.value })}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace(/_/g, ' ') : 'All statuses'}
            </option>
          ))}
        </select>
        <label>
          From
          <input type="date" value={startDate} onChange={(e) => update({ startDate: e.target.value })} />
        </label>
        <label>
          To
          <input type="date" value={endDate} onChange={(e) => update({ endDate: e.target.value })} />
        </label>
        <select value={sortBy} onChange={(e) => update({ sortBy: e.target.value })}>
          <option value="orderDate">Sort by date</option>
          <option value="totalPrice">Sort by total</option>
        </select>
        <select value={sortOrder} onChange={(e) => update({ sortOrder: e.target.value })}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th className="right">Total</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && result?.data.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  No orders found. Try another filter or sync from Shopify.
                </td>
              </tr>
            )}
            {!loading &&
              result?.data.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/orders/${order.id}`}>{order.orderNumber}</Link>
                  </td>
                  <td>{formatDate(order.orderDate)}</td>
                  <td>{order.customerName ?? 'Not available'}</td>
                  <td>{order.financialStatus ?? 'Not available'}</td>
                  <td>{order.fulfillmentStatus ?? 'Not available'}</td>
                  <td className="right">{formatMoney(order.totalPrice, order.currency)}</td>
                  <td>{order.source}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {result && result.pagination.totalPages > 1 && (
        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
            Previous
          </button>
          <span>
            Page {page} of {result.pagination.totalPages} ({result.pagination.total} orders)
          </span>
          <button
            type="button"
            disabled={page >= result.pagination.totalPages}
            onClick={() => update({ page: String(page + 1) })}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
