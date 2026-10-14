/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Bus, ArrowLeft, Save, Edit } from 'lucide-react';
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
    route_name: '',
    operator_name: '',
    bus_type: '',
    bus_number: '',
    departure_date: '',
    departure_time: '',
    arrival_time: '',
    base_fare: 850,
    available_seats: 45,
    total_seats: 45,
    status: 'SCHEDULED',
  });

  const { data: scheduleData } = useQuery({
    queryKey: ['admin-bus-schedule', scheduleId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/admin/schedules/${scheduleId}`);
        return res.data?.data || res.data;
      } catch {
        return {
          id: scheduleId,
          route_name: 'Ahmedabad ➔ Diu',
          operator_name: 'Shree Travels',
          bus_type: 'AC Sleeper 2+1',
          bus_number: 'GJ-01-1001',
          departure_date: '2026-10-15',
          departure_time: '06:00 AM',
          arrival_time: '02:30 PM',
          base_fare: 850,
          available_seats: 38,
          total_seats: 45,
          status: 'SCHEDULED',
        };
      }
    },
    enabled: Boolean(scheduleId),
  });

  useEffect(() => {
    if (scheduleData) {
      setFormData({
        route_name: scheduleData.route_name || scheduleData.route_id || '',
        operator_name: scheduleData.operator_name || scheduleData.operator_id || '',
        bus_type: scheduleData.bus_type || 'AC Sleeper',
        bus_number: scheduleData.bus_number || scheduleData.bus_id || '',
        departure_date: scheduleData.departure_date || '2026-10-15',
        departure_time: scheduleData.departure_time || '06:00 AM',
        arrival_time: scheduleData.arrival_time || '02:30 PM',
        base_fare: scheduleData.base_fare || 850,
        available_seats: scheduleData.available_seats || 38,
        total_seats: scheduleData.total_seats || 45,
        status: scheduleData.status || 'SCHEDULED',
      });
    }
  }, [scheduleData]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.patch(`/admin/schedules/${scheduleId}`, payload);
    },
    onSuccess: () => {
      toast.success('Schedule updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-bus-schedules'] });
      router.push('/schedules');
    },
    onError: () => {
      toast.error('Failed to update schedule');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

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
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Edit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Edit Schedule #{scheduleId?.substring(0, 8)}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify timing, fare tariffs, available seat allocations, or cancellation status.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Route Corridor</label>
              <Input
                required
                value={formData.route_name}
                onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Fleet Operator</label>
              <Input
                required
                value={formData.operator_name}
                onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Departure Date</label>
              <Input
                required
                type="date"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Departure Time</label>
              <Input
                required
                value={formData.departure_time}
                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Arrival Time</label>
              <Input
                required
                value={formData.arrival_time}
                onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Base Fare (₹)</label>
              <Input
                required
                type="number"
                value={formData.base_fare}
                onChange={(e) => setFormData({ ...formData, base_fare: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Available Seats</label>
              <Input
                required
                type="number"
                value={formData.available_seats}
                onChange={(e) => setFormData({ ...formData, available_seats: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="BOARDING">BOARDING</option>
                <option value="DEPARTED">DEPARTED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/schedules">
              <Button type="button" variant="outline" className="rounded-xl px-5">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 gap-2 shadow-md shadow-blue-500/20"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditBusSchedulePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading schedule editor...</div>}>
      <EditBusScheduleContent />
    </Suspense>
  );
}
