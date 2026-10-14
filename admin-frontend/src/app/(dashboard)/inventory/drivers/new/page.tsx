/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, Users, Award, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

function NewDriverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultOpId = searchParams.get('operator_id') || '';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    address: '',
    operator_id: defaultOpId,
    is_active: true,
  });

  const { data: operators } = useQuery({
    queryKey: ['admin-bus-operators'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/operators');
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const opId = formData.operator_id || operators?.[0]?.id;
    if (!opId) {
      toast.error('Please assign a bus operator');
      return;
    }

    // Client-side phone and license validation
    if (!formData.phone.startsWith('+91') && formData.phone.length === 10) {
      formData.phone = `+91${formData.phone}`;
    }

    setLoading(true);

    try {
      await apiClient.post('/bus/drivers', {
        ...formData,
        operator_id: opId,
      });

      toast.success('Driver registered successfully!');
      router.push('/inventory/drivers');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/inventory/drivers">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Onboard Heavy Coach Driver</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify commercial driving license credentials and assign to partner operator agency.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Fleet Operator Agency *</label>
            <select
              required
              value={formData.operator_id || operators?.[0]?.id || ''}
              onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(operators || []).map((op: any) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Driver Full Legal Name *</label>
              <Input
                required
                placeholder="e.g. Ramesh Patel"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Driver Mobile Phone (+91) *</label>
              <Input
                required
                placeholder="+919876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Heavy Commercial License Number *</label>
            <Input
              required
              placeholder="e.g. DL-1420110012345"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value.toUpperCase() })}
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono uppercase font-bold tracking-wider"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Residential Address</label>
            <Input
              placeholder="Permanent address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="h-11 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link href="/inventory/drivers">
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
            {loading ? 'Saving...' : 'Register Driver'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewDriverPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading new driver form...</div>}>
      <NewDriverContent />
    </Suspense>
  );
}

