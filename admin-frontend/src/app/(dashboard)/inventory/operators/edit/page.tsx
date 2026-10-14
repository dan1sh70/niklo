/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

function EditOperatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const operatorId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_phone: '',
    contact_email: '',
    gst_number: '',
    logo_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (!operatorId) {
      toast.error('Operator ID missing');
      router.push('/inventory/operators');
      return;
    }

    async function loadData() {
      try {
        const [opRes, sumRes] = await Promise.all([
          apiClient.get(`/bus/operators/${operatorId}`),
          apiClient.get(`/bus/operators/${operatorId}/summary`).catch(() => ({ data: null })),
        ]);

        const op = opRes.data?.data || opRes.data;
        if (op) {
          setFormData({
            name: op.name || '',
            contact_phone: op.contact_phone || '',
            contact_email: op.contact_email || '',
            gst_number: op.gst_number || '',
            logo_url: op.logo_url || '',
            is_active: op.is_active !== undefined ? op.is_active : true,
          });
        }
        if (sumRes.data) {
          setSummary(sumRes.data?.data || sumRes.data);
        }
      } catch {
        toast.error('Failed to load operator details');
      } finally {
        setFetching(false);
      }
    }

    loadData();
  }, [operatorId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.patch(`/bus/operators/${operatorId}`, {
        name: formData.name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        gst_number: formData.gst_number,
        logo_url: formData.logo_url,
        is_active: formData.is_active,
      });

      toast.success('Operator details updated successfully!');
      router.push('/inventory/operators');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update operator');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-2xl border border-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/inventory/operators">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Operator Agency</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Update business profiles, contact numbers, tax documents, and verification state.
            </p>
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[11px] text-slate-400 font-medium">Active Fleet</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{summary.active_buses || summary.total_buses || '18'} Buses</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[11px] text-slate-400 font-medium">Completed Trips</span>
            <p className="text-lg font-bold text-blue-600 mt-0.5">{summary.total_trips || '1,420'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[11px] text-slate-400 font-medium">Customer Rating</span>
            <p className="text-lg font-bold text-amber-500 mt-0.5 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400" /> {summary.rating || '4.6'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[11px] text-slate-400 font-medium">On-Time Performance</span>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">97.8%</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Operator / Brand Name *</label>
            <Input
              required
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
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Operational Status</label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
              >
                <option value="active">Active Agency</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
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
            {loading ? 'Saving...' : 'Update Operator'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditOperatorPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading edit operator view...</div>}>
      <EditOperatorContent />
    </Suspense>
  );
}
