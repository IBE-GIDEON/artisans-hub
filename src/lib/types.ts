export type Category = "Rice & meals" | "Quick bites" | "Small chops" | "Drinks" | "Combos";

export type MenuItem = {
  id: string;
  name: string;
  category: Category;
  description: string;
  /** Price in kobo (NGN minor units). */
  priceMinor: number;
  emoji: string;
  tone: "orange" | "yellow" | "green" | "brown" | "red";
  tag?: string;
  available: boolean;
  prepMinutes: number;
  allergens: string[];
  featured?: boolean;
  sort?: number;
};

export type OrderStatus =
  | "pending_payment"
  | "verifying"
  | "confirmed"
  | "preparing"
  | "ready"
  | "dispatched"
  | "completed"
  | "cancelled";

export type PaymentMethod = "bank_transfer" | "online";
export type PaymentStatus = "unpaid" | "verifying" | "paid" | "refunded";
export type Fulfilment = "delivery" | "pickup";

export type OrderLine = {
  itemId: string;
  nameSnapshot: string;
  unitPriceMinor: number;
  quantity: number;
};

export type Order = {
  id: string;
  ref: string;
  customerName: string;
  phone: string;
  email?: string;
  fulfilment: Fulfilment;
  zoneId?: string;
  landmark?: string;
  scheduledFor: string;
  timeSlot: string;
  notes?: string;
  allergyNotes?: string;
  lines: OrderLine[];
  subtotalMinor: number;
  feeMinor: number;
  discountMinor: number;
  totalMinor: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  internalNotes?: string;
};

export type EnquiryStatus = "new" | "contacted" | "quoted" | "accepted" | "scheduled" | "completed" | "lost";

export type CateringEnquiry = {
  id: string;
  ref: string;
  name: string;
  phone: string;
  eventType: string;
  eventDate: string;
  guests: string;
  budgetMinor?: number;
  requestedItems: string;
  venue: string;
  status: EnquiryStatus;
  quoteMinor?: number;
  depositMinor?: number;
  assignedTo?: string;
  createdAt: string;
};

export type Zone = { id: string; name: string; feeMinor: number; etaMinutes: number; active: boolean; sort?: number };

export type StaffRole = "owner" | "orders" | "kitchen" | "finance" | "catering";
export type StaffMember = { userId: string; name: string; email: string; role: StaffRole; active: boolean };

/** What a customer sees on their order page (returned by the get_order RPC). */
export type PublicOrder = {
  ref: string;
  token: string;
  customerName: string;
  phone: string;
  fulfilment: Fulfilment;
  zoneName?: string;
  landmark?: string;
  scheduledFor: string;
  timeSlot: string;
  subtotalMinor: number;
  feeMinor: number;
  totalMinor: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  updatedAt: string;
  lines: { name: string; unitPriceMinor: number; quantity: number }[];
};

export type Settings = {
  businessName: string;
  openTime: string;
  closeTime: string;
  pickupPoint: string;
  supportPhone: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  acceptingOrders: boolean;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
  at: string;
};

export type CartState = Record<string, number>;

export type Catalog = { menu: MenuItem[]; zones: Zone[]; settings: Settings };
