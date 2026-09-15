'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { referralsApi } from '@/lib/api';
import { toast } from 'sonner';

export default function EditReferralPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sales_executive_id: '',
    referred_user_id: '',
    referral_code: '',
  });

  useEffect(() => {
    referralsApi.findOne(id)
      .then(data => {
        setFormData({
          sales_executive_id: data.sales_executive_id,
          referred_user_id: data.referred_user_id,
          referral_code: data.referral_code,
        });
      })
      .catch(() => toast.error('Failed to load referral details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await referralsApi.update(id, {
        sales_executive_id: formData.sales_executive_id,
        referred_user_id: formData.referred_user_id,
        referral_code: formData.referral_code,
      });

      toast.success('Referral updated successfully!');
      router.push('/sales/referrals');
    } catch {
      toast.error('Failed to update referral record');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sales/referrals">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Edit Referral Record</h2>
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
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
