'use client';
import { PAYMENT_TERMS_OPTIONS } from '@/lib/order-workflow';
import type { CommercialTermsDefaults } from '@/lib/ux-workflow';
const field =
  'mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3 text-base sm:text-sm';
export const EMPTY_COMMERCIAL_TERMS: CommercialTermsDefaults = {
  minimumOrder: '',
  fulfillmentMethods: '',
  fulfillmentRegion: '',
  paymentTerms: '',
  responseWindow: '',
  contactNote: '',
};
export function CommercialTermsPanel({
  value,
  onChange,
  disabled = false,
}: {
  value: CommercialTermsDefaults;
  onChange: (next: CommercialTermsDefaults) => void;
  disabled?: boolean;
}) {
  const update = (key: keyof CommercialTermsDefaults, next: string) =>
    onChange({ ...value, [key]: next });
  return (
    <section
      id="terms"
      className="scroll-mt-36 rounded-xl border border-pf-line bg-pf-surface p-4 sm:p-6"
    >
      <span id="commercial-terms" className="scroll-mt-36" />
      <h2 className="mb-4 font-semibold">Order terms</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Minimum order ($, optional)
          <input
            inputMode="decimal"
            value={value.minimumOrder}
            disabled={disabled}
            onChange={(e) => update('minimumOrder', e.target.value)}
            onBlur={() => {
              const n = value.minimumOrder.replace(/[$,]/g, '').trim();
              if (n && Number.isFinite(Number(n))) update('minimumOrder', n);
            }}
            className={field}
            placeholder="No minimum"
          />
        </label>
        <fieldset>
          <legend className="text-sm">Fulfillment</legend>
          <div className="mt-1 flex flex-wrap gap-3">
            {['Pickup', 'Delivery'].map((method) => (
              <label
                key={method}
                className="flex min-h-11 items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-emerald-500"
                  disabled={disabled}
                  checked={value.fulfillmentMethods
                    .toLowerCase()
                    .includes(method.toLowerCase())}
                  onChange={(e) => {
                    const current = ['Pickup', 'Delivery'].filter(
                      (m) =>
                        value.fulfillmentMethods
                          .toLowerCase()
                          .includes(m.toLowerCase()) && m !== method
                    );
                    update(
                      'fulfillmentMethods',
                      [...current, ...(e.target.checked ? [method] : [])].join(
                        ', '
                      )
                    );
                  }}
                />
                {method}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="text-sm">
          Delivery area (optional)
          <input
            value={value.fulfillmentRegion}
            disabled={disabled}
            onChange={(e) => update('fulfillmentRegion', e.target.value)}
            className={field}
          />
        </label>
        <label className="text-sm">
          Payment terms
          <select
            value={value.paymentTerms}
            disabled={disabled}
            onChange={(e) => update('paymentTerms', e.target.value)}
            className={field}
          >
            <option value="">Choose terms</option>
            {[
              ...new Set([
                ...PAYMENT_TERMS_OPTIONS,
                ...(value.paymentTerms ? [value.paymentTerms] : []),
              ]),
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Response time (optional)
          <select
            value={value.responseWindow}
            disabled={disabled}
            onChange={(e) => update('responseWindow', e.target.value)}
            className={field}
          >
            <option value="">Choose response time</option>
            {[
              ...new Set([
                'Same business day',
                'Within 1 business day',
                'Within 2 business days',
                ...(value.responseWindow ? [value.responseWindow] : []),
              ]),
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Contact note (optional)
          <textarea
            rows={2}
            maxLength={500}
            value={value.contactNote}
            disabled={disabled}
            onChange={(e) => update('contactNote', e.target.value)}
            className={`${field} py-2`}
          />
        </label>
      </div>
    </section>
  );
}
