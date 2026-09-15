'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { vendorsApi } from '@/lib/api';
import { toast } from 'sonner';

export default function NewVendorPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    gst_number: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vendorsApi.create(formData);
      toast.success('Vendor created successfully!');
      router.push('/admin/vendors');
    } catch {
      toast.error('Failed to create vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/vendors">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Add New Vendor</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner_name">Owner Name</Label>
                <Input id="owner_name" name="owner_name" value={formData.owner_name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input id="gst_number" name="gst_number" value={formData.gst_number} onChange={handleChange} />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-2">
              <Link href="/admin/vendors">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Vendor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
