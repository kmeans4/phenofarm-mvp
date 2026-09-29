'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { toast } from '@/app/hooks/useToast';
import { US_STATES } from '@/lib/us-states';
export type CustomerData = {
  id?: string;
  businessName: string;
  email?: string | null;
  phone?: string | null;
  contactName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  website?: string | null;
  description?: string | null;
  licenseNumber?: string | null;
  isPlatformManaged?: boolean;
};
const fields = [
  ['businessName', 'Business name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['contactName', 'Contact name'],
  ['address', 'Street address'],
  ['city', 'City'],
  ['zipCode', 'ZIP code'],
  ['licenseNumber', 'License number'],
  ['website', 'Website'],
] as const;
export function CustomerForm({
  customer,
  compact = false,
  onSaved,
  onCancel,
}: {
  customer?: CustomerData;
  compact?: boolean;
  onSaved?: (value: CustomerData & { id: string }) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const baseline = useRef({
    businessName: customer?.businessName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    contactName: customer?.contactName || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    zipCode: customer?.zip || '',
    licenseNumber: customer?.licenseNumber || '',
    website: customer?.website || '',
    description: customer?.description || '',
  });
  const [form, setForm] = useState(baseline.current);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const { setIsDirty, resetDirtyState, confirmNavigation } = useUnsavedChanges({
    enabled: !compact,
  });
  useEffect(
    () => setIsDirty(JSON.stringify(form) !== JSON.stringify(baseline.current)),
    [form, setIsDirty]
  );
  async function save() {
    if (pending.current) return;
    const next: Record<string, string> = {};
    if (!form.businessName.trim())
      next.businessName = 'Enter the business name.';
    if (!form.email.trim() && !form.phone.trim()) {
      next.email = 'Add an email or phone number.';
      next.phone = next.email;
    } else {
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        next.email = 'Enter a valid email.';
      if (form.phone && form.phone.replace(/\D/g, '').length < 7)
        next.phone = 'Enter a valid phone number.';
    }
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`customer-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    pending.current = true;
    try {
      const res = await fetch(
        `/api/customers${customer?.id ? `/${customer.id}` : ''}`,
        {
          method: customer?.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save customer.');
      resetDirtyState();
      toast.success('Customer saved');
      if (onSaved) onSaved(data);
      else {
        router.push(`/grower/customers/${data.id}`);
        router.refresh();
      }
    } catch (e) {
      setErrors({
        form: e instanceof Error ? e.message : 'Could not save customer.',
      });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const content = (
    <>
      {errors.form && (
        <p role="alert" className="text-sm text-pf-danger">
          {errors.form}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields
          .filter(
            ([key]) =>
              !compact || ['businessName', 'email', 'phone'].includes(key)
          )
          .map(([key, label]) => (
            <label
              key={key}
              htmlFor={`customer-${key}`}
              className="block text-sm"
            >
              {label}
              {key !== 'businessName' && !['email', 'phone'].includes(key)
                ? ' (optional)'
                : ''}
              <input
                id={`customer-${key}`}
                type={
                  key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'
                }
                value={form[key]}
                disabled={customer?.isPlatformManaged}
                onChange={(e) => {
                  setForm({ ...form, [key]: e.target.value });
                  setErrors((previous) =>
                    Object.fromEntries(
                      Object.entries(previous).filter(
                        ([name]) =>
                          name !== key &&
                          !(
                            e.target.value.trim() &&
                            ['email', 'phone'].includes(key) &&
                            ['email', 'phone'].includes(name) &&
                            previous[name] === 'Add an email or phone number.'
                          )
                      )
                    )
                  );
                }}
                aria-invalid={!!errors[key]}
                aria-describedby={
                  errors[key] ? `customer-${key}-error` : undefined
                }
                className="mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3"
              />
              {errors[key] && (
                <span
                  id={`customer-${key}-error`}
                  className="mt-1 block text-sm text-pf-danger"
                >
                  {errors[key]}
                </span>
              )}
            </label>
          ))}
        {!compact && (
          <>
            <label className="text-sm" htmlFor="customer-state">
              State (optional)
              <select
                id="customer-state"
                disabled={customer?.isPlatformManaged}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3"
              >
                <option value="">Choose state</option>
                {US_STATES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label
              className="text-sm sm:col-span-2"
              htmlFor="customer-description"
            >
              Notes (optional)
              <textarea
                id="customer-description"
                disabled={customer?.isPlatformManaged}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-pf-line-strong bg-pf-raised p-3"
              />
            </label>
          </>
        )}
      </div>
      <div className="flex gap-2 pt-4">
        {!customer?.isPlatformManaged && (
          <Button
            type={compact ? 'button' : 'submit'}
            onClick={compact ? () => void save() : undefined}
            disabled={busy}
          >
            {busy ? 'Saving…' : compact ? 'Add customer' : 'Save customer'}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            if (await confirmNavigation()) {
              if (onCancel) onCancel();
              else
                router.push(
                  customer?.id
                    ? `/grower/customers/${customer.id}`
                    : '/grower/customers'
                );
            }
          }}
        >
          Cancel
        </Button>
      </div>
    </>
  );
  return compact ? (
    <div className="rounded-xl border border-pf-line p-4">{content}</div>
  ) : (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-3 rounded-xl border border-pf-line bg-pf-surface p-4 sm:p-6"
    >
      {customer?.isPlatformManaged && (
        <p className="text-sm">This customer manages their own profile.</p>
      )}
      {content}
    </form>
  );
}
