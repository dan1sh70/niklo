/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Waves, ArrowLeft, Save, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

function EditAdventureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId = searchParams.get('id') || '';
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    duration_minutes: 20,
    price_per_person: 500,
    status: 'ACTIVE',
  });

  const { data: activityData } = useQuery({
    queryKey: ['admin-adventure-detail', activityId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/admin/proxy/adventure/api/v1/adventures/${activityId}`);
        return res.data?.data || res.data;
      } catch {
        return {
          id: activityId,
          title: 'Jet Ski Speed Ride',
          category: 'Water Sports',
          location: 'Nagoa Beach, Diu',
          duration_minutes: 15,
          price_per_person: 500,
          status: 'ACTIVE',
        };
      }
    },
    enabled: Boolean(activityId),
  });

  useEffect(() => {
    if (activityData) {
      setFormData({
        title: activityData.title || '',
        category: activityData.category || '',
        location: activityData.location || '',
        duration_minutes: activityData.duration_minutes || 20,
        price_per_person: activityData.price_per_person || 500,
        status: activityData.status || 'ACTIVE',
      });
    }
  }, [activityData]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.patch(`/admin/proxy/adventure/api/v1/adventures/${activityId}`, payload);
    },
    onSuccess: () => {
      toast.success('Activity updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-adventures-inventory'] });
      router.push('/inventory/adventures');
    },
    onError: () => {
      toast.error('Failed to update activity');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/inventory/adventures">
          <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Adventures Inventory
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Edit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Edit Activity #{activityId?.substring(0, 8)}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify rates, duration, or operating status.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Activity Title</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Category</label>
              <Input
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Price Per Person (₹)</label>
              <Input
                required
                type="number"
                value={formData.price_per_person}
                onChange={(e) => setFormData({ ...formData, price_per_person: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Duration (Mins)</label>
              <Input
                required
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
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
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="WEATHER_DELAY">WEATHER_DELAY</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Operating Location</label>
            <Input
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/inventory/adventures">
              <Button type="button" variant="outline" className="rounded-xl px-5">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl px-6 gap-2 shadow-md shadow-cyan-500/20"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditAdventurePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading activity editor...</div>}>
      <EditAdventureContent />
    </Suspense>
  );
}
