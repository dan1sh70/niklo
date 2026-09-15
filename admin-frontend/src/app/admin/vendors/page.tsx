'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { vendorsApi, type Vendor } from '@/lib/api';
import { toast } from 'sonner';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorsApi.findAll()
      .then(setVendors)
      .catch(() => toast.error('Failed to load vendors'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await vendorsApi.remove(id);
      setVendors(prev => prev.filter(v => v.id !== id));
      toast.success('Vendor deleted successfully');
    } catch {
      toast.error('Failed to delete vendor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Vendors</h2>
        <Link href="/admin/vendors/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Add Vendor
          </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Company Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No vendors found. Click &quot;Add Vendor&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.company_name}</TableCell>
                  <TableCell>{vendor.owner_name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.plan || '—'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      vendor.status === 'Active' ? 'bg-green-100 text-green-700' :
                      vendor.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {vendor.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/vendors/${vendor.id}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4 text-blue-500" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(vendor.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
