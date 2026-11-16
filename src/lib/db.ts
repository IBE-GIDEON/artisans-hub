/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AuditEvent, CateringEnquiry, MenuItem, Order, Settings, StaffMember, Zone } from "./types";

// Row ↔ app-model mappers. Database columns are snake_case, money is integer kobo.

export const toMenuItem = (r: any): MenuItem => ({
  id: r.id, name: r.name, category: r.category, description: r.description, priceMinor: r.price_minor, emoji: r.emoji, tone: r.tone,
  tag: r.tag ?? undefined, available: r.available, prepMinutes: r.prep_minutes, allergens: r.allergens ?? [], featured: r.featured, sort: r.sort,
});

export const fromMenuItem = (m: MenuItem) => ({
  name: m.name, category: m.category, description: m.description, price_minor: m.priceMinor, emoji: m.emoji, tone: m.tone, tag: m.tag ?? null,
  available: m.available, prep_minutes: m.prepMinutes, allergens: m.allergens, featured: !!m.featured, sort: m.sort ?? 0,
});

export const toZone = (r: any): Zone => ({ id: r.id, name: r.name, feeMinor: r.fee_minor, etaMinutes: r.eta_minutes, active: r.active, sort: r.sort });

export const toSettings = (r: any): Settings => ({
  businessName: r.business_name, openTime: r.open_time, closeTime: r.close_time, pickupPoint: r.pickup_point, supportPhone: r.support_phone,
  bankName: r.bank_name, accountName: r.account_name, accountNumber: r.account_number, acceptingOrders: r.accepting_orders,
});

export const fromSettings = (s: Settings) => ({
  business_name: s.businessName, open_time: s.openTime, close_time: s.closeTime, pickup_point: s.pickupPoint, support_phone: s.supportPhone,
  bank_name: s.bankName, account_name: s.accountName, account_number: s.accountNumber, accepting_orders: s.acceptingOrders,
});

export const toOrder = (r: any): Order => ({
  id: r.id, ref: r.ref, customerName: r.customer_name, phone: r.phone, email: r.email ?? undefined, fulfilment: r.fulfilment,
  zoneId: r.zone_id ?? undefined, landmark: r.landmark ?? undefined, scheduledFor: r.scheduled_for, timeSlot: r.time_slot,
  notes: r.notes ?? undefined, allergyNotes: r.allergy_notes ?? undefined,
  lines: (r.order_items ?? []).map((i: any) => ({ itemId: i.menu_item_id, nameSnapshot: i.name_snapshot, unitPriceMinor: i.unit_price_minor, quantity: i.quantity })),
  subtotalMinor: r.subtotal_minor, feeMinor: r.fee_minor, discountMinor: r.discount_minor, totalMinor: r.total_minor,
  paymentMethod: r.payment_method, paymentStatus: r.payment_status, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
  internalNotes: r.internal_notes ?? undefined,
});

export const toEnquiry = (r: any): CateringEnquiry => ({
  id: r.id, ref: r.ref, name: r.name, phone: r.phone, eventType: r.event_type, eventDate: r.event_date, guests: r.guests,
  budgetMinor: r.budget_minor ?? undefined, requestedItems: r.requested_items, venue: r.venue, status: r.status,
  quoteMinor: r.quote_minor ?? undefined, depositMinor: r.deposit_minor ?? undefined, assignedTo: r.assigned_to ?? undefined, createdAt: r.created_at,
});

export const toAudit = (r: any): AuditEvent => ({ id: r.id, actor: r.actor, action: r.action, entity: r.entity, detail: r.detail, at: r.at });

export const toStaff = (r: any): StaffMember => ({ userId: r.user_id, name: r.name, email: r.email, role: r.role, active: r.active });

/** Postgres raises friendly messages from our RPCs; strip driver noise. */
export const dbError = (e: { message?: string } | null | undefined) => e?.message?.replace(/^.*?ERROR:\s*/, "") || "Something went wrong. Please try again.";
