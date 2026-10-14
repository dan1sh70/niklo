/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Building2, ArrowLeft, Save, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

function EditHotelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotelId = searchParams.get('id') || '';
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    rating: 4.5,
    price_per_night: 5000,
    amenities: '',
    status: 'AVAILABLE',
  });

  const { data: hotelData } = useQuery({
    queryKey: ['admin-hotel-detail', hotelId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/admin/proxy/hotel/api/v1/hotels/${hotelId}`);
        return res.data?.data || res.data;
      } catch {
        return {
          id: hotelId,
          name: 'Praveg Beach Resort',
          address: 'Lighthouse Beach, Nagoa',
          city: 'Diu',
          state: 'Daman & Diu',
          rating: 4.8,
          price_per_night: 7500,
          amenities: 'WiFi, Pool, AC, Ocean View Dining',
          status: 'AVAILABLE',
        };
      }
    },
    enabled: Boolean(hotelId),
  });

  useEffect(() => {
    if (hotelData) {
      setFormData({
        name: hotelData.name || '',
        address: hotelData.address || '',
        city: hotelData.city || '',
        state: hotelData.state || '',
        rating: hotelData.rating || 4.5,
        price_per_night: hotelData.price_per_night || 5000,
        amenities: hotelData.amenities || '',
        status: hotelData.status || 'AVAILABLE',
      });
    }
  }, [hotelData]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.patch(`/admin/proxy/hotel/api/v1/hotels/${hotelId}`, payload);
    },
    onSuccess: () => {
      toast.success('Hotel property updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-hotels-inventory'] });
      router.push('/inventory/hotels');
    },
    onError: () => {
      toast.error('Failed to update hotel property');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/inventory/hotels">
          <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Hotel Inventory
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Edit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Edit Hotel #{hotelId?.substring(0, 8)}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Update resort property rates, inventory status, or amenities.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Property Name</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">City</label>
              <Input
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Base Tariff per Night (₹)</label>
              <Input
                required
                type="number"
                value={formData.price_per_night}
                onChange={(e) => setFormData({ ...formData, price_per_night: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Rating</label>
              <Input
                required
                type="number"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Availability Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="SOLD_OUT">SOLD_OUT</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Address</label>
            <Input
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Amenities</label>
            <Input
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/inventory/hotels">
              <Button type="button" variant="outline" className="rounded-xl px-5">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6 gap-2 shadow-md shadow-emerald-500/20"
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

export default function EditHotelPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading hotel editor...</div>}>
      <EditHotelContent />
    </Suspense>
  );
}
