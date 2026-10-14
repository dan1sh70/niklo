/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Bus, ArrowLeft, Save, Calendar, Clock, IndianRupee, Building2, Route as RouteIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

function EditBusScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get('id') || '';
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    operator_id: '',
    route_id: '',
    bus_id: '',
    departure_date: '',
    departure_time: '',
    arrival_time: '',
    base_fare: 850,
    available_seats: 45,
    status: 'SCHEDULED',
  });

  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['admin-bus-schedule', scheduleId],
    queryFn: async () => {
      const res = await apiClient.get(`/bus/schedules/${scheduleId}`);
      return res.data?.data || res.data;
    },
    enabled: Boolean(scheduleId),
  });

  const { data: operators } = useQuery({
    queryKey: ['admin-bus-operators'],
    queryFn: async () => {
      const res = await apiClient.get('/bus/operators');
      return res.data?.data || res.data || [];
    },
  });

  const { data: routes } = useQuery({
    queryKey: ['admin-bus-routes'],
    queryFn: async () => {
      const res = await apiClient.get('/bus/routes');
      return res.data?.data || res.data || [];
    },
  });

  const { data: buses } = useQuery({
    queryKey: ['admin-operator-buses', formData.operator_id],
    queryFn: async () => {
      const res = await apiClient.get('/bus/buses', {
        params: formData.operator_id ? { operator_id: formData.operator_id } : undefined,
      });
      return res.data?.data || res.data || [];
    },
  });

  useEffect(() => {
    if (scheduleData) {
      setFormData({
        operator_id: scheduleData.operator_id || scheduleData.operator?.id || '',
        route_id: scheduleData.route_id || scheduleData.route?.id || '',
        bus_id: scheduleData.bus_id || scheduleData.bus?.id || '',
        departure_date: scheduleData.departure_date || '',
        departure_time: scheduleData.departure_time?.slice(0, 5) || '',
        arrival_time: scheduleData.arrival_time?.slice(0, 5) || '',
        base_fare: Number(scheduleData.base_fare || 850),
        available_seats: Number(scheduleData.available_seats || 36),
        status: scheduleData.status || 'SCHEDULED',
      });
    }
  }, [scheduleData]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.patch(`/bus/schedules/${scheduleId}`, payload);
    },
    onSuccess: () => {
      toast.success('Schedule updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-bus-schedules'] });
      router.push('/schedules');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update schedule');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      departure_date: formData.departure_date,
      departure_time: formData.departure_time,
      arrival_time: formData.arrival_time,
      base_fare: Number(formData.base_fare),
      available_seats: Number(formData.available_seats),
      status: formData.status,
    });
  };

  if (scheduleLoading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-3xl border border-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/schedules">
          <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Schedules
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Edit Departure Trip Schedule</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify departure timestamps, base ticket tariff, seat status, and operational lifecycle.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Linked Relational Context */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Connected Fleet & Route Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Fleet Operator:</span>
                <span className="font-bold text-slate-900">
                  {scheduleData?.operator?.name || 'Verified Agency'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Highway Route:</span>
                <span className="font-bold text-slate-900">
                  {scheduleData?.route?.source_city} ➔ {scheduleData?.route?.destination_city}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Coach Number:</span>
                <span className="font-bold text-slate-900">
                  {scheduleData?.bus?.registration_number || 'Assigned Coach'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Departure Timings & Fares */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Timings & Availability
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Departure Date *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.departure_date}
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Departure Time *
                </label>
                <Input
                  type="time"
                  required
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Arrival Time *
                </label>
                <Input
                  type="time"
                  required
                  value={formData.arrival_time}
                  onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Base Fare (₹) *
                </label>
                <Input
                  type="number"
                  min="50"
                  required
                  value={formData.base_fare}
                  onChange={(e) => setFormData({ ...formData, base_fare: Number(e.target.value) })}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Available Bookable Seats
                </label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={formData.available_seats}
                  onChange={(e) => setFormData({ ...formData, available_seats: Number(e.target.value) })}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Trip Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="SCHEDULED">SCHEDULED (Open for bookings)</option>
                  <option value="BOARDING">BOARDING (At bus stand)</option>
                  <option value="COMPLETED">COMPLETED (Arrived at destination)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/schedules">
              <Button type="button" variant="outline" className="h-11 rounded-xl px-5 text-sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-11 rounded-xl px-6 bg-[#0066FF] hover:bg-blue-600 text-white font-bold gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Updating...' : 'Update Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditBusSchedulePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading edit schedule view...</div>}>
      <EditBusScheduleContent />
    </Suspense>
  );
}
