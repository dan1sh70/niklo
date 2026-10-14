/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

function EditDriverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverId = searchParams.get('id') || '';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    address: '',
    operator_id: '',
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

  useEffect(() => {
    if (!driverId) {
      toast.error('Driver ID missing');
      router.push('/inventory/drivers');
      return;
    }

    async function loadDriver() {
      try {
        const res = await apiClient.get(`/bus/drivers/${driverId}`);
        const data = res.data?.data || res.data;
        if (data) {
          setFormData({
            name: data.name || '',
            phone: data.phone || '',
            license_number: data.license_number || '',
            address: data.address || '',
            operator_id: data.operator_id || '',
            is_active: data.is_active !== undefined ? data.is_active : true,
          });
        }
      } catch {
        toast.error('Failed to load driver details');
      } finally {
        setFetching(false);
      }
    }

    loadDriver();
  }, [driverId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.patch(`/bus/drivers/${driverId}`, formData);
      toast.success('Driver profile updated successfully!');
      router.push('/inventory/drivers');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update driver');
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/inventory/drivers">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Driver Profile</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify driver credentials, phone number, and operator affiliation.
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
              value={formData.operator_id}
              onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800"
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Driver Mobile Phone (+91) *</label>
              <Input
                required
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
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value.toUpperCase() })}
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono uppercase font-bold tracking-wider"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Residential Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Roster Status</label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
              >
                <option value="active">Active (Eligible for assignment)</option>
                <option value="inactive">Inactive / On Leave</option>
              </select>
            </div>
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
            {loading ? 'Saving...' : 'Update Driver'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditDriverPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading edit driver view...</div>}>
      <EditDriverContent />
    </Suspense>
  );
}
