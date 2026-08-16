export interface Permission {
  _id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isActive: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role | string;
  active: boolean;
}

export interface AuthResponse {
  status: string;
  token: string;
  message: string;
  data: {
    user: User;
  };
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Unit {
  _id: string;
  name: string;
  abbreviation: string;
  description?: string;
  isActive: boolean;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  isActive: boolean;
}

export interface Product {
  _id: string;
  productName: string;
  sku: string;
  barcode?: string;
  description?: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  status: "active" | "inactive" | "discontinued";
  isLowStock: boolean;
  isOutOfStock: boolean;
  stockValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  _id: string;
  product: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export type PurchaseStatus = "pending" | "received" | "cancelled";

export interface Purchase {
  _id: string;
  referenceNo: string;
  supplier: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: PurchaseStatus;
  purchaseDate: string;
  note?: string;
  createdBy: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  createdAt: string;
}

export type AdjustmentType = "stock_in" | "stock_out" | "adjustment";

export interface StockAdjustment {
  _id: string;
  product: string;
  type: AdjustmentType;
  quantity: number;
  adjustedQuantity: number;
  variance: number;
  reason: string;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockMovement {
  _id: string;
  product: string;
  type: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceId?: string;
  referenceType?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  user: string;
  type: "low_stock" | "out_of_stock" | "purchase_received" | "purchase_cancelled" | "system";
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  user: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: { before?: unknown; after?: unknown };
  ipAddress?: string;
  userAgent?: string;
  note?: string;
  createdAt: string;
}

export interface PageParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  [key: string]: string | number | undefined;
}

export interface DashboardStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  lowStockProducts: Array<{
    _id: string;
    productName: string;
    sku?: string;
    currentStock: number;
    reorderLevel: number;
    status: "active" | "inactive" | "discontinued";
  }>;
}
