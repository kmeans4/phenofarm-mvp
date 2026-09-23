'use client';

import { Download } from 'lucide-react';

function cell(value: unknown) { const text = String(value ?? ''); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }

export function OrderRecordExport({ order, label = 'Export CSV' }: { label?: string; order: { orderId: string; createdAt: string; status: string; grower: string; buyer: string; subtotal: number; tax: number; shippingFee: number; total: number; items: Array<{ name: string; quantity: number; unit: string; unitPrice: number; totalPrice: number; quoted: boolean }> } }) {
  function download() {
    const headers = ['Request ID','Created','Status','Grower','Buyer','Product','Quantity','Unit','Unit price','Line total','Pricing source','Subtotal','Recorded tax','Shipping estimate','Total','Settlement'];
    const rows = order.items.map((item) => [order.orderId, order.createdAt, order.status, order.grower, order.buyer, item.name, item.quantity, item.unit, item.unitPrice.toFixed(2), item.totalPrice.toFixed(2), item.quoted ? 'Accepted quote' : 'List price', order.subtotal.toFixed(2), order.tax.toFixed(2), order.shippingFee.toFixed(2), order.total.toFixed(2), 'Settled directly between businesses — no funds processed by PhenoFarm']);
    const blob = new Blob([[headers, ...rows].map((row) => row.map(cell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = href; link.download = `phenofarm-request-${order.orderId}.csv`; link.click(); URL.revokeObjectURL(href);
  }
  return <button type="button" onClick={download} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"><Download className="h-4 w-4" />{label}</button>;
}
