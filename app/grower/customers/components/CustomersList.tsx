'use client';

import { KeyboardEvent, MouseEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, Loader2, MessageCircle } from 'lucide-react';
import { toast } from '@/app/hooks/useToast';

export interface CustomerListItem {
  id: string;
  businessName: string;
  licenseNumber: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  orderCount: number;
  isPlatformMember: boolean;
  canEdit: boolean;
  lastOrderDateLabel: string;
  totalDeliveredValueLabel: string;
}

interface CustomersListProps {
  customers: CustomerListItem[];
}

function customerHref(customerId: string) {
  return `/grower/customers/${customerId}/edit`;
}

function requestsHref(customerId: string) {
  return `/grower/orders?dispensary=${encodeURIComponent(customerId)}`;
}

function displayValue(value: string | null) {
  return value?.trim() ? value : '—';
}

function formatLocation(customer: CustomerListItem) {
  const parts = [customer.city, customer.state].filter((value): value is string => Boolean(value?.trim()));
  return parts.length > 0 ? parts.join(', ') : '—';
}

export default function CustomersList({ customers }: CustomersListProps) {
  const router = useRouter();
  const [openingMessageFor, setOpeningMessageFor] = useState<string | null>(null);

  const openCustomer = (customerId: string) => {
    router.push(customerHref(customerId));
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement | HTMLDivElement>, customerId: string) => {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    openCustomer(customerId);
  };

  const openMessage = async (event: MouseEvent<HTMLButtonElement>, customer: CustomerListItem) => {
    event.stopPropagation();
    setOpeningMessageFor(customer.id);

    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispensaryId: customer.id }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open customer conversation');
      }

      window.dispatchEvent(
        new CustomEvent('phenofarm-open-chat', {
          detail: {
            conversationId: data.conversationId,
            draft: `Hi ${customer.businessName}, I wanted to follow up on your requests.`,
            context: [
              { label: 'Customer', value: customer.businessName },
              { label: 'Last request', value: customer.lastOrderDateLabel },
              { label: 'Delivered value', value: customer.totalDeliveredValueLabel },
            ],
          },
        }),
      );
      toast.success('Draft ready in messages');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open customer conversation');
    } finally {
      setOpeningMessageFor(null);
    }
  };

  const stopPropagation = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <>
      <div className="sm:hidden divide-y divide-gray-100">
        {customers.map((customer) => (
          <div
            key={customer.id}
            role="link"
            tabIndex={0}
            onClick={() => openCustomer(customer.id)}
            onKeyDown={(event) => handleRowKeyDown(event, customer.id)}
            className="cursor-pointer p-3 space-y-2 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600"
            aria-label={`View ${customer.businessName}`}
          >
            <div>
              <p className="break-words font-medium text-gray-900">{customer.businessName}</p>
              {customer.licenseNumber && (
                <p className="mt-1 text-xs text-gray-500">License: {customer.licenseNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1 text-sm text-gray-600">
              {customer.contactName && customer.contactName !== customer.businessName && <p>{customer.contactName}</p>}
              <p className="break-all"><span className="sr-only">Email: </span>{displayValue(customer.email)}</p>
              <p><span className="sr-only">Phone: </span>{displayValue(customer.phone)}</p>
              <p><span className="sr-only">Location: </span>{formatLocation(customer)}</p>
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 pt-1 text-xs">
                <p><span className="text-gray-500">Last request:</span> {customer.lastOrderDateLabel}</p>
                <p><span className="text-gray-500">Delivered:</span> {customer.totalDeliveredValueLabel}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {customer.isPlatformMember && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                  PhenoFarm member
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700">
                {customer.orderCount} request{customer.orderCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link href={customerHref(customer.id)} onClick={stopPropagation} className="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-green-700">{customer.canEdit ? 'Edit contact' : 'Details'}</Link>
              <Link href={`/grower/customers/${customer.id}/statement`} onClick={stopPropagation} className="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-green-700">Statement</Link>
              <Link
                href={requestsHref(customer.id)}
                onClick={stopPropagation}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                Requests
              </Link>
              <button
                type="button"
                onClick={(event) => openMessage(event, customer)}
                disabled={openingMessageFor === customer.id}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                {openingMessageFor === customer.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                )}
                Message
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">Business</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">Contact</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">Last request</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">Delivered value</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">Location</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                role="link"
                tabIndex={0}
                onClick={() => openCustomer(customer.id)}
                onKeyDown={(event) => handleRowKeyDown(event, customer.id)}
                className="cursor-pointer transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600"
                aria-label={`View ${customer.businessName}`}
              >
                <td className="px-3 py-3 sm:px-6">
                  <div className="font-medium text-gray-900">{customer.businessName}</div>
                  {customer.licenseNumber && <div className="text-xs text-gray-500">License: {customer.licenseNumber}</div>}
                  {customer.isPlatformMember && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      PhenoFarm member
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 sm:px-6">
                  {customer.contactName !== customer.businessName && <div>{displayValue(customer.contactName)}</div>}
                  <div className="text-xs text-gray-500">{displayValue(customer.email)}</div>
                  <div className="text-xs text-gray-500">{displayValue(customer.phone)}</div>
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 sm:px-6">{customer.lastOrderDateLabel}</td>
                <td className="px-3 py-3 text-sm font-semibold text-gray-900 sm:px-6">{customer.totalDeliveredValueLabel}</td>
                <td className="px-3 py-3 text-sm text-gray-600 sm:px-6">{formatLocation(customer)}</td>
                <td className="px-3 py-3 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={customerHref(customer.id)} onClick={stopPropagation} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-green-700">{customer.canEdit ? 'Edit contact' : 'Details'}</Link>
                    <Link href={`/grower/customers/${customer.id}/statement`} onClick={stopPropagation} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-green-700">Statement</Link>
                    <Link
                      href={requestsHref(customer.id)}
                      onClick={stopPropagation}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                    >
                      <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                      Requests
                    </Link>
                    <button
                      type="button"
                      onClick={(event) => openMessage(event, customer)}
                      disabled={openingMessageFor === customer.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                    >
                      {openingMessageFor === customer.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Message
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden divide-y divide-gray-100 sm:block md:hidden">
        {customers.map((customer) => (
          <div
            key={customer.id}
            role="link"
            tabIndex={0}
            onClick={() => openCustomer(customer.id)}
            onKeyDown={(event) => handleRowKeyDown(event, customer.id)}
            className="cursor-pointer p-4 space-y-3 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600"
            aria-label={`View ${customer.businessName}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{customer.businessName}</p>
                <p className="mt-1 text-sm text-gray-500">{customer.contactName !== customer.businessName ? `${displayValue(customer.contactName)} · ` : ''}{displayValue(customer.email)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                {customer.orderCount} request{customer.orderCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Last request</p>
                <p className="mt-1">{customer.lastOrderDateLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Delivered value</p>
                <p className="mt-1 font-semibold text-gray-900">{customer.totalDeliveredValueLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Phone</p>
                <p className="mt-1">{displayValue(customer.phone)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Location</p>
                <p className="mt-1">{formatLocation(customer)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link href={customerHref(customer.id)} onClick={stopPropagation} className="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-green-700">{customer.canEdit ? 'Edit contact' : 'Details'}</Link>
              <Link href={`/grower/customers/${customer.id}/statement`} onClick={stopPropagation} className="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-green-700">Statement</Link>
              <Link
                href={requestsHref(customer.id)}
                onClick={stopPropagation}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                Requests
              </Link>
              <button
                type="button"
                onClick={(event) => openMessage(event, customer)}
                disabled={openingMessageFor === customer.id}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                {openingMessageFor === customer.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                )}
                Message
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
