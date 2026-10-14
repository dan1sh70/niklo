/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Waves, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateAdventurePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: 'Parasailing Adventure',
    category: 'Water Sports',
    location: 'Nagoa Beach, Diu',
    duration_minutes: 25,
    price_per_person: 800,
    max_participants: 8,
    description: 'High flying parasailing experience with safety gear and boat tow.',
    safety_guidelines: 'Life jackets provided. Not recommended for pregnant women or heart patients.',
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admin/proxy/adventure/api/v1/adventures', payload);
    },
    onSuccess: () => {
      toast.success('Adventure activity published successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-adventures-inventory'] });
      router.push('/inventory/adventures');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to publish adventure activity');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Create New Adventure Activity</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Add water sports, island boat tours, and aerial adventures for booking on Niklo.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Activity Details</h2>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Activity Title</label>
              <Input
                required
                placeholder="e.g. Parasailing Adventure"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Category</label>
                <Input
                  required
                  placeholder="e.g. Water Sports / Aerial"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Beach / Location</label>
                <Input
                  required
                  placeholder="e.g. Nagoa Beach, Diu"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Pricing & Slot Limits</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Rate per Person (₹)</label>
                <Input
                  required
                  type="number"
                  value={formData.price_per_person}
                  onChange={(e) => setFormData({ ...formData, price_per_person: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Duration (Minutes)</label>
                <Input
                  required
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Max Slot Capacity</label>
                <Input
                  required
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Safety & Operating Guidelines</label>
              <Input
                value={formData.safety_guidelines}
                onChange={(e) => setFormData({ ...formData, safety_guidelines: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/inventory/adventures">
              <Button type="button" variant="outline" className="rounded-xl px-5">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl px-6 gap-2 shadow-md shadow-cyan-500/20"
            >
              <Save className="w-4 h-4" />
              {createMutation.isPending ? 'Publishing...' : 'Save & Publish Activity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
