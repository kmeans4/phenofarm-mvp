'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, Mail, MapPin, Send, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';

const SUPPORT_EMAIL = 'support@phenoshop.app';

const businessTypes = [
  { value: 'grower', label: 'Grower' },
  { value: 'dispensary', label: 'Dispensary' },
  { value: 'other', label: 'Other' },
];

interface ContactFormData {
  name: string;
  email: string;
  businessType: string;
  message: string;
}

interface ContactFormErrors {
  name?: string;
  email?: string;
  businessType?: string;
  message?: string;
}

export default function ContactPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    businessType: '',
    message: '',
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});

  const selectedBusinessType = businessTypes.find((type) => type.value === formData.businessType);

  const validateForm = () => {
    const nextErrors: ContactFormErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email';
    }

    if (!formData.businessType) {
      nextErrors.businessType = 'Choose a business type';
    }

    if (!formData.message.trim()) {
      nextErrors.message = 'Message is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildMailtoUrl = () => {
    const businessTypeLabel = selectedBusinessType?.label || 'Not specified';
    const subject = `PhenoShop inquiry from ${formData.name.trim()} (${businessTypeLabel})`;
    const body = [
      `Name: ${formData.name.trim()}`,
      `Email: ${formData.email.trim()}`,
      `Business type: ${businessTypeLabel}`,
      '',
      'Message:',
      formData.message.trim(),
    ].join('\n');

    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    window.location.href = buildMailtoUrl();
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-[#070908] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-18rem] h-[36rem] w-[52rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[130px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-8 sm:py-10 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-gray-400 transition-colors hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start"
        >
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Contact PhenoShop
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Wholesale workflow help.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
              Tell us whether you are a grower, dispensary, or partner and include the details the
              PhenoShop support team should know.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-colors hover:border-emerald-400/30 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="mt-1 font-medium text-white transition-colors group-hover:text-emerald-200">
                      {SUPPORT_EMAIL}
                    </p>
                  </div>
                </div>
              </a>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="mt-1 font-medium text-white">Vermont, USA</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-sm leading-6 text-gray-400">
                  PhenoShop coordinates marketplace workflows and cultivator subscriptions. Wholesale payment
                  settlement stays directly between licensed businesses.
                </p>
              </div>
            </div>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="rounded-3xl border border-white/[0.06] bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur sm:p-8"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white">Email us</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                These details help support route your request.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-300">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => {
                    setFormData((current) => ({ ...current, name: event.target.value }));
                    if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder="Jane Smith"
                  className={`w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-white placeholder:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908] ${
                    errors.name ? 'border-red-400/70' : 'border-white/[0.08] hover:border-white/15'
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-300">{errors.name}</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => {
                      setFormData((current) => ({ ...current, email: event.target.value }));
                      if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
                    }}
                    placeholder="jane@company.com"
                    className={`w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-white placeholder:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908] ${
                      errors.email ? 'border-red-400/70' : 'border-white/[0.08] hover:border-white/15'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-300">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="businessType" className="mb-2 block text-sm font-medium text-gray-300">
                    Business type
                  </label>
                  <select
                    id="businessType"
                    value={formData.businessType}
                    onChange={(event) => {
                      setFormData((current) => ({ ...current, businessType: event.target.value }));
                      if (errors.businessType) setErrors((current) => ({ ...current, businessType: undefined }));
                    }}
                    className={`w-full rounded-xl border bg-[#111611] px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908] ${formData.businessType ? 'text-white' : 'text-gray-500'} ${
                      errors.businessType ? 'border-red-400/70' : 'border-white/[0.08] hover:border-white/15'
                    }`}
                  >
                    <option value="" className="bg-[#111611] text-gray-400">Select one</option>
                    {businessTypes.map((type) => (
                      <option key={type.value} value={type.value} className="bg-[#111611] text-white">
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.businessType && <p className="mt-1 text-sm text-red-300">{errors.businessType}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-300">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  value={formData.message}
                  onChange={(event) => {
                    setFormData((current) => ({ ...current, message: event.target.value }));
                    if (errors.message) setErrors((current) => ({ ...current, message: undefined }));
                  }}
                  placeholder="Tell us what you are trying to solve..."
                  className={`min-h-36 w-full resize-y rounded-xl border bg-white/[0.04] px-4 py-3 text-white placeholder:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908] ${
                    errors.message ? 'border-red-400/70' : 'border-white/[0.08] hover:border-white/15'
                  }`}
                />
                {errors.message && <p className="mt-1 text-sm text-red-300">{errors.message}</p>}
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_0_40px_rgba(16,185,129,0.25)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_56px_rgba(16,185,129,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]"
              >
                <Send className="h-5 w-5" />
                Open email draft
              </button>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </main>
  );
}
