export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerName: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: string;
  currency: string;
  orderDate: string;
  source: string;
}

export interface OrderListResponse {
  data: OrderListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface OrderDetail extends OrderListItem {
  customerEmail: string | null;
  subtotalPrice: string | null;
  items: {
    id: string;
    title: string;
    sku: string | null;
    shopifyVariantId: string | null;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }[];
}

export interface ShopifyStatus {
  connected: boolean;
  shopDomain?: string;
  scopes?: string;
  connectedAt?: string;
}

export interface SyncSummary {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}
