/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Package, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreatePackagePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: 'Diu Coastal Getaway & Fort Tour',
    destination: 'Diu & Somnath',
    days: 4,
    nights: 3,
    price: 12500,
    highlights: 'Praveg Beach Resort stay, Historical Fort Diu tour, Watersports session voucher, Somnath temple visit',
    description: 'An all-inclusive island getaway featuring seaside resort stay, sightseeing, and adventure activities.',
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admin/proxy/package/api/v1/packages', payload);
    },
    onSuccess: () => {
      toast.success('Tour package published successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-packages-inventory'] });
      router.push('/inventory/packages');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create tour package');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/inventory/packages">
          <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Packages Inventory
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Create New Tour Package</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Publish comprehensive holiday bundles with hotel stays, transit, and guided activities.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Itinerary Overview</h2>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Package Title</label>
              <Input
                required
                placeholder="e.g. Diu Island Weekend Escape"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Destinations Covered</label>
                <Input
                  required
                  placeholder="e.g. Diu, Somnath, Dwarka"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Package Price (₹)</label>
                <Input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Duration (Days)</label>
                <Input
                  required
                  type="number"
                  value={formData.days}
                  onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Duration (Nights)</label>
                <Input
                  required
                  type="number"
                  value={formData.nights}
                  onChange={(e) => setFormData({ ...formData, nights: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Inclusions & Highlights</h2>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Key Highlights (Comma Separated)</label>
              <Input
                placeholder="Praveg Resort glamping, Jet Ski voucher, Fort Diu walk, Somnath VIP darshan"
                value={formData.highlights}
                onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/inventory/packages">
              <Button type="button" variant="outline" className="rounded-xl px-5">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl px-6 gap-2 shadow-md shadow-purple-500/20"
            >
              <Save className="w-4 h-4" />
              {createMutation.isPending ? 'Publishing...' : 'Save & Publish Package'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
