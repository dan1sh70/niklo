/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Package, Plus, Calendar, MapPin, Search, X, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PackagesInventoryPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    destination: 'Diu & Somnath',
    days: 4,
    nights: 3,
    price: 12500,
    highlights: 'Lighthouse, Fort Diu, Somnath Temple Aarti, Beach Stay',
  });

  const { data: packages } = useQuery({
    queryKey: ['admin-packages-inventory'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/proxy/package/api/v1/packages');
        return res.data?.data || res.data || [];
      } catch {
        return [
          {
            id: 'pkg-01',
            title: 'Diu Coastal Getaway & Fort Tour',
            destination: 'Diu',
            days: 3,
            nights: 2,
            price: 8999,
            highlights: ['Praveg Beach Resort', 'Water Sports voucher', 'Historical Fort Visit'],
            status: 'PUBLISHED',
          },
          {
            id: 'pkg-02',
            title: 'Saurashtra Spiritual & Beach Circuit',
            destination: 'Diu, Somnath & Dwarka',
            days: 5,
            nights: 4,
            price: 15499,
            highlights: ['Somnath Temple VIP Darshan', 'Dwarkadhish', 'Beachside Bonfire'],
            status: 'PUBLISHED',
          },
          {
            id: 'pkg-03',
            title: 'Gir Forest Safari + Diu Islands',
            destination: 'Gir & Diu',
            days: 4,
            nights: 3,
            price: 18200,
            highlights: ['Asiatic Lion Safari', 'Diu Beach Glamping', 'Private Cab Transfer'],
            status: 'PUBLISHED',
          },
        ];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admin/proxy/package/api/v1/packages', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages-inventory'] });
      setIsModalOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredPackages = (packages || []).filter((p: any) =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            Tour Packages Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage curated travel itineraries, holiday bundles, and multi-day packages.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Package
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <Input
          placeholder="Filter packages by title or destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 p-0 text-sm"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPackages.map((pkg: any) => (
          <div
            key={pkg.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md w-fit mb-3">
                <Calendar className="w-3.5 h-3.5" />
                {pkg.days} Days / {pkg.nights} Nights
              </div>

              <h3 className="font-bold text-slate-900 text-lg mb-1 leading-snug">{pkg.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{pkg.destination}</span>
              </div>

              {Array.isArray(pkg.highlights) && (
                <div className="space-y-1.5 mb-4">
                  {pkg.highlights.map((h: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Starting Price</span>
                <div className="text-xl font-black text-slate-900">
                  ₹{Number(pkg.price).toLocaleString()}
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Published
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-slate-900 mb-1">Create Tour Package</h2>
            <p className="text-xs text-slate-400 mb-6">Build an all-inclusive travel package with hotel, travel, and activities.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Package Title</label>
                <Input
                  required
                  placeholder="e.g. Diu Island Weekend Escape"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Destinations Covered</label>
                  <Input
                    required
                    placeholder="e.g. Diu & Somnath"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Package Price (₹)</label>
                  <Input
                    required
                    type="number"
                    placeholder="9999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Days</label>
                  <Input
                    required
                    type="number"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nights</label>
                  <Input
                    required
                    type="number"
                    value={formData.nights}
                    onChange={(e) => setFormData({ ...formData, nights: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Key Highlights</label>
                <Input
                  placeholder="Comma separated: Beach resort, Fort tour, Sightseeing"
                  value={formData.highlights}
                  onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
                >
                  {createMutation.isPending ? 'Publishing...' : 'Create & Publish'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
