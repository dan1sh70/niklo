'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { referralsApi } from '@/lib/api';
import { toast } from 'sonner';

export default function NewReferralPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sales_executive_id: '',
    referred_user_id: '',
    referral_code: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await referralsApi.create({
        ...formData,
        total_revenue_generated: 0,
        commission_earned: 0,
      });

      toast.success('Referral created successfully!');
      router.push('/sales/referrals');
    } catch {
      toast.error('Failed to create referral record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sales/referrals">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Create Referral Record</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sales_executive_id">Sales Executive ID</Label>
              <Input id="sales_executive_id" name="sales_executive_id" placeholder="UUID of the executive" value={formData.sales_executive_id} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referred_user_id">Referred User ID</Label>
              <Input id="referred_user_id" name="referred_user_id" placeholder="UUID of the referred vendor/user" value={formData.referred_user_id} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral_code">Referral Code Used</Label>
              <Input id="referral_code" name="referral_code" placeholder="e.g. NIKLO-ABC" value={formData.referral_code} onChange={handleChange} required />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Link href="/sales/referrals">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Record
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
