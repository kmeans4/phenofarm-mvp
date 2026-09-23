'use client';

import { Download } from 'lucide-react';
import { parseOrderRequestNotes } from '@/lib/order-workflow';

function cell(value: unknown) {
  let text = String(value ?? '');
  // Spreadsheet readers must treat business names and free-text notes as data.
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r]/.test(text)) text = "'" + text;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function OrderRecordExport({ order, label = 'Export CSV' }: { label?: string; order: { orderId: string; createdAt: string; status: string; notes: string | null; grower: string; buyer: string; subtotal: number; tax: number; shippingFee: number; total: number; items: Array<{ name: string; quantity: number; unit: string; unitPrice: number; totalPrice: number; quoted: boolean }> } }) {
  function download() {
    const { details, notesText } = parseOrderRequestNotes(order.notes);
    const headers = ['Request ID','Created','Status','Grower','Buyer','Product','Quantity','Unit','Unit price','Line total','Pricing source','Subtotal','Recorded tax','Shipping estimate','Total','Fulfillment method','Requested window','Payment terms','Notes','Settlement'];
    const rows = order.items.map((item) => [order.orderId, order.createdAt, order.status, order.grower, order.buyer, item.name, item.quantity, item.unit, item.unitPrice.toFixed(2), item.totalPrice.toFixed(2), item.quoted ? 'Accepted quote' : 'List price', order.subtotal.toFixed(2), order.tax.toFixed(2), order.shippingFee.toFixed(2), order.total.toFixed(2), details.fulfillmentMethod, details.requestedWindow, details.paymentTerms, notesText, 'Arranged directly between businesses; payment status not tracked by PhenoFarm']);
    const blob = new Blob([[headers, ...rows].map((row) => row.map(cell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = href; link.download = `phenofarm-request-${order.orderId}.csv`; link.click(); URL.revokeObjectURL(href);
  }
  return <button type="button" onClick={download} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-pf-line-strong bg-pf-surface px-4 text-sm font-semibold text-pf-secondary hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"><Download className="h-4 w-4" />{label}</button>;
}
