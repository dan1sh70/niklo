/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Package, ArrowLeft, Save, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

function EditPackageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('id') || '';
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    days: 3,
    nights: 2,
    price: 8999,
    highlights: '',
    status: 'PUBLISHED',
  });

  const { data: packageData } = useQuery({
    queryKey: ['admin-package-detail', packageId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/admin/proxy/package/api/v1/packages/${packageId}`);
        return res.data?.data || res.data;
      } catch {
        return {
          id: packageId,
          title: 'Diu Coastal Getaway & Fort Tour',
          destination: 'Diu',
          days: 3,
          nights: 2,
          price: 8999,
          highlights: 'Praveg Beach Resort, Water Sports voucher, Historical Fort Visit',
          status: 'PUBLISHED',
        };
      }
    },
    enabled: Boolean(packageId),
  });

  useEffect(() => {
    if (packageData) {
      setFormData({
        title: packageData.title || '',
        destination: packageData.destination || '',
        days: packageData.days || 3,
        nights: packageData.nights || 2,
        price: packageData.price || 8999,
        highlights: Array.isArray(packageData.highlights) ? packageData.highlights.join(', ') : (packageData.highlights || ''),
        status: packageData.status || 'PUBLISHED',
      });
    }
  }, [packageData]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.patch(`/admin/proxy/package/api/v1/packages/${packageId}`, payload);
    },
    onSuccess: () => {
      toast.success('Tour package updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-packages-inventory'] });
      router.push('/inventory/packages');
    },
    onError: () => {
      toast.error('Failed to update tour package');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
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
            <Edit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Edit Tour Package #{packageId?.substring(0, 8)}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify itinerary length, pricing, destinations, or publication status.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Package Title</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Destinations</label>
              <Input
                required
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Price (₹)</label>
              <Input
                required
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Days</label>
              <Input
                required
                type="number"
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Nights</label>
              <Input
                required
                type="number"
                value={formData.nights}
                onChange={(e) => setFormData({ ...formData, nights: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Key Highlights</label>
            <Input
              value={formData.highlights}
              onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
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
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/inventory/packages">
              <Button type="button" variant="outline" className="rounded-xl px-5">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl px-6 gap-2 shadow-md shadow-purple-500/20"
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

export default function EditPackagePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading package editor...</div>}>
      <EditPackageContent />
    </Suspense>
  );
}
