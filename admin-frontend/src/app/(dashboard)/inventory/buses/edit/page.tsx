/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, Armchair, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

function EditBusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const busId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    registration_number: '',
    bus_type: 'AC_SLEEPER',
    total_seats: 36,
    operator_id: '',
    is_active: true,
    amenities: {
      wifi: true,
      charging: true,
      water_bottle: true,
      blanket: true,
    },
  });

  const { data: operators } = useQuery({
    queryKey: ['admin-bus-operators'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/operators');
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    if (!busId) {
      toast.error('Bus ID missing');
      router.push('/inventory/buses');
      return;
    }

    async function loadBus() {
      try {
        const res = await apiClient.get(`/bus/buses/${busId}`);
        const bus = res.data?.data || res.data;
        if (bus) {
          const opId = bus.operator_id || (bus.operator && bus.operator.id) || '';
          setFormData({
            registration_number: bus.registration_number || '',
            bus_type: bus.bus_type || 'AC_SLEEPER',
            total_seats: bus.total_seats || 36,
            operator_id: opId,
            is_active: bus.is_active !== undefined ? bus.is_active : true,
            amenities: bus.amenities || { wifi: true, charging: true },
          });
        }
      } catch {
        toast.error('Failed to load bus details');
      } finally {
        setFetching(false);
      }
    }

    loadBus();
  }, [busId, router]);

  const toggleAmenity = (key: string) => {
    setFormData((prev: any) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [key]: !prev.amenities[key],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registration_number.trim()) {
      toast.error('Registration number is required');
      return;
    }
    setLoading(true);

    try {
      const payload: Record<string, any> = {
        registration_number: formData.registration_number.trim().toUpperCase(),
        bus_type: formData.bus_type,
        total_seats: Number(formData.total_seats),
        amenities: formData.amenities,
        is_active: formData.is_active,
      };

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (formData.operator_id && uuidRegex.test(formData.operator_id.trim())) {
        payload.operator_id = formData.operator_id.trim();
      }

      await apiClient.patch(`/bus/buses/${busId}`, payload);

      toast.success('Bus details updated successfully!');
      router.push('/inventory/buses');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update bus');
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
          <Link href="/inventory/buses">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Bus Specification</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Update registration number, operator agency assignment, and amenities.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Fleet Operator Agency *</label>
            <select
              value={formData.operator_id}
              onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Keep Current Operator / Unchanged --</option>
              {(operators || []).map((op: any) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.contact_phone || 'Registered Agency'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Registration / Plate Number *</label>
            <Input
              required
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
              className="h-11 rounded-xl bg-slate-50 border-slate-200 uppercase font-mono font-bold tracking-wider"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Coach / Bus Type *</label>
            <select
              value={formData.bus_type}
              onChange={(e) => setFormData({ ...formData, bus_type: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="AC_SLEEPER">AC Sleeper (2+1 Luxury)</option>
              <option value="AC_SEATER">AC Seater (2+2 Pushback)</option>
              <option value="NON_AC_SLEEPER">Non-AC Sleeper</option>
              <option value="NON_AC_SEATER">Non-AC Seater Standard</option>
              <option value="VOLVO_AC">Volvo AC Multi-Axle</option>
              <option value="LUXURY_COACH">Luxury Coach Express</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Total Seat Capacity *</label>
            <div className="relative">
              <Armchair className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="number"
                min="10"
                max="65"
                required
                value={formData.total_seats}
                onChange={(e) => setFormData({ ...formData, total_seats: Number(e.target.value) })}
                className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Fleet Status</label>
            <select
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
            >
              <option value="active">Active (Available for Schedules)</option>
              <option value="inactive">Inactive / In Maintenance</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-700 block mb-3">Onboard Amenities & Conveniences</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'wifi', label: 'High-speed WiFi' },
              { key: 'charging', label: 'USB Charging Ports' },
              { key: 'water_bottle', label: 'Complimentary Water' },
              { key: 'blanket', label: 'Blanket & Pillow' },
              { key: 'reading_light', label: 'Individual Reading Lamp' },
              { key: 'live_tracking', label: 'GPS Live Tracking' },
              { key: 'emergency_exit', label: 'Emergency Door Safety' },
              { key: 'air_purifier', label: 'Air Quality Purifier' },
            ].map(({ key, label }) => {
              const active = Boolean(formData.amenities[key as keyof typeof formData.amenities]);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleAmenity(key)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all text-left ${
                    active
                      ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                      active ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link href="/inventory/buses">
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
            {loading ? 'Saving...' : 'Update Bus Details'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditBusPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading edit bus view...</div>}>
      <EditBusContent />
    </Suspense>
  );
}
