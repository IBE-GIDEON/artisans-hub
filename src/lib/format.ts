import type { EnquiryStatus, OrderStatus, PaymentStatus } from "./types";

export const naira = (minor: number) =>
  "₦" + Math.round(minor / 100).toLocaleString("en-NG");

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const uid = () => Math.random().toString(36).slice(2, 10);

export const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  pending_payment: { label: "Pending payment", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  verifying: { label: "Verifying payment", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
  confirmed: { label: "Confirmed", tone: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  preparing: { label: "Preparing", tone: "bg-orange-50 text-orange-700 ring-orange-200" },
  ready: { label: "Ready for pickup", tone: "bg-teal-50 text-teal-700 ring-teal-200" },
  dispatched: { label: "Dispatched", tone: "bg-violet-50 text-violet-700 ring-violet-200" },
  completed: { label: "Completed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  cancelled: { label: "Cancelled", tone: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: string }> = {
  unpaid: { label: "Unpaid", tone: "bg-stone-100 text-stone-600 ring-stone-200" },
  verifying: { label: "Verifying", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
  paid: { label: "Paid", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  refunded: { label: "Refunded", tone: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export const ENQUIRY_STATUS: Record<EnquiryStatus, { label: string; tone: string }> = {
  new: { label: "New", tone: "bg-orange-50 text-orange-700 ring-orange-200" },
  contacted: { label: "Contacted", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
  quoted: { label: "Quoted", tone: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  accepted: { label: "Accepted", tone: "bg-teal-50 text-teal-700 ring-teal-200" },
  scheduled: { label: "Scheduled", tone: "bg-violet-50 text-violet-700 ring-violet-200" },
  completed: { label: "Completed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  lost: { label: "Lost", tone: "bg-stone-100 text-stone-600 ring-stone-200" },
};

/** Customer-facing progression for delivery vs pickup orders. */
export const trackingSteps = (fulfilment: "delivery" | "pickup"): OrderStatus[] =>
  fulfilment === "delivery"
    ? ["pending_payment", "confirmed", "preparing", "dispatched", "completed"]
    : ["pending_payment", "confirmed", "preparing", "ready", "completed"];

export const nextStatus = (status: OrderStatus, fulfilment: "delivery" | "pickup"): OrderStatus | null => {
  const flow: OrderStatus[] =
    fulfilment === "delivery"
      ? ["pending_payment", "verifying", "confirmed", "preparing", "dispatched", "completed"]
      : ["pending_payment", "verifying", "confirmed", "preparing", "ready", "completed"];
  const i = flow.indexOf(status);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
};
