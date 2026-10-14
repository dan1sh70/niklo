/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateHotelPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: 'Praveg Beach Resort',
    address: 'Lighthouse Beach, Nagoa',
    city: 'Diu',
    state: 'Daman & Diu',
    rating: 4.8,
    price_per_night: 7500,
    description: 'Luxury beachfront glamping and cottages overlooking the Arabian Sea.',
    amenities: 'Free High-speed WiFi, Swimming Pool, Ocean View Dining, Air Conditioning',
    total_rooms: 40,
    checkin_time: '12:00 PM',
    checkout_time: '10:00 AM',
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admin/proxy/hotel/api/v1/hotels', payload);
    },
    onSuccess: () => {
      toast.success('Hotel property added successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-hotels-inventory'] });
      router.push('/inventory/hotels');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add hotel property');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Add New Hotel Property</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Register property details, amenities, room tariffs, and operational guidelines.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Property Identity & Location</h2>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Property Name</label>
              <Input
                required
                placeholder="e.g. Praveg Beach Resort"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">City</label>
                <Input
                  required
                  placeholder="e.g. Diu"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">State</label>
                <Input
                  required
                  placeholder="e.g. Gujarat / Daman & Diu"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Street Address / Landmark</label>
              <Input
                required
                placeholder="e.g. Lighthouse Beach Road, Nagoa"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Pricing, Rating & Rooms</h2>

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
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Total Room Inventory</label>
                <Input
                  required
                  type="number"
                  value={formData.total_rooms}
                  onChange={(e) => setFormData({ ...formData, total_rooms: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Initial Star Rating</label>
                <Input
                  required
                  type="number"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Property Amenities</label>
              <Input
                placeholder="WiFi, Swimming Pool, Ocean View Dining, AC, Free Breakfast"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/inventory/hotels">
              <Button type="button" variant="outline" className="rounded-xl px-5">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6 gap-2 shadow-md shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              {createMutation.isPending ? 'Publishing...' : 'Save & Publish Hotel'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
