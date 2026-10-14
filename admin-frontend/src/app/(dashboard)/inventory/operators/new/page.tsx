/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewOperatorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_phone: '',
    contact_email: '',
    gst_number: '',
    logo_url: 'https://cdn.niklo.com/operators/default.png',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact_phone.trim()) {
      toast.error('Operator brand name and contact phone are required');
      return;
    }
    setLoading(true);

    try {
      await apiClient.post('/bus/operators', {
        name: formData.name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        gst_number: formData.gst_number,
        logo_url: formData.logo_url,
        is_active: formData.is_active,
      });

      toast.success('Bus operator registered successfully!');
      router.push('/inventory/operators');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register operator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/inventory/operators">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Register Bus Fleet Operator</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Onboard travel operator companies, partner logistics, and bus fleet owners.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Operator / Brand Name *</label>
            <Input
              required
              placeholder="e.g. Shree Travels Diu"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Primary Contact Phone *</label>
              <Input
                required
                placeholder="+91 98765 43210"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Contact Email Address *</label>
              <Input
                type="email"
                required
                placeholder="support@operator.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">GST Registration Number</label>
              <Input
                placeholder="24AAAAA0000A1Z5"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Logo / Badge URL</label>
              <Input
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link href="/inventory/operators">
            <Button type="button" variant="outline" className="h-11 rounded-xl px-5 text-sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 rounded-xl px-6 bg-[#0066FF] hover:bg-blue-600 text-white gap-2 font-medium shadow-sm"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Registering...' : 'Register Operator'}
          </Button>
        </div>
      </form>
    </div>
  );
}
