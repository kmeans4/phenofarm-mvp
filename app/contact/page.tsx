'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  inquiryType: string[];
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  inquiryType?: string;
}

export default function ContactPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
    inquiryType: [],
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inquiryTypes = [
    { id: 'grower', label: 'Grower' },
    { id: 'dispensary', label: 'Dispensary' },
    { id: 'other', label: 'Other' },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (formData.inquiryType.length === 0) {
      newErrors.inquiryType = 'Please select at least one inquiry type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Store in state (mock)
    console.log('Form submitted:', formData);

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleInquiryTypeChange = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      inquiryType: prev.inquiryType.includes(id)
        ? prev.inquiryType.filter((type) => type !== id)
        : [...prev.inquiryType, id],
    }));
    // Clear error when selection changes
    if (errors.inquiryType) {
      setErrors((prev) => ({ ...prev, inquiryType: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-gray-950 pt-24 pb-12">
        <div className="max-w-xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Thank You!
            </h1>
            <p className="text-gray-400 mb-8">
              Your message has been sent successfully. Our team will get back to you within 24 hours.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have questions about PhenoFarm? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-8">
                Contact Information
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">hello@phenofarm.io</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Phone</p>
                    <p className="text-white">(555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Location</p>
                    <p className="text-white">San Francisco, CA</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800">
                <p className="text-gray-400 text-sm mb-4">Business Hours</p>
                <p className="text-white">Monday - Friday: 9am - 6pm PST</p>
                <p className="text-gray-500">Saturday - Sunday: Closed</p>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Send us a Message
              </h2>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all ${
                      errors.name ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email & Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, email: e.target.value }));
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="john@company.com"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, phone: e.target.value }));
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all ${
                        errors.phone ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="(555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Business Inquiry Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Business Type *
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {inquiryTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleInquiryTypeChange(type.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          formData.inquiryType.includes(type.id)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-green-500/50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  {errors.inquiryType && (
                    <p className="text-red-400 text-sm mt-1">{errors.inquiryType}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, message: e.target.value }));
                      if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none ${
                      errors.message ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="Tell us about your business and how we can help..."
                  />
                  {errors.message && (
                    <p className="text-red-400 text-sm mt-1">{errors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
