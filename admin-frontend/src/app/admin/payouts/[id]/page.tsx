'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { payoutsApi, type Payout } from '@/lib/api';
import { toast } from 'sonner';

export default function ProcessPayoutPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [payout, setPayout] = useState<Payout | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    payoutsApi.findOne(id)
      .then(setPayout)
      .catch(() => toast.error('Failed to load payout details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await payoutsApi.process(id, {
        status,
        transaction_ref: transactionRef || undefined,
        rejection_reason: rejectionReason || undefined,
      });

      toast.success(`Payout ${status.toLowerCase()} successfully!`);
      router.push('/admin/payouts');
    } catch {
      toast.error(`Failed to ${status.toLowerCase()} payout`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-gray-500">Payout record not found</p>
        <Link href="/admin/payouts">
          <Button variant="outline">Back to Payouts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/payouts">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Process Payout</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout Details (ID: {payout.id})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium">Vendor ID</p>
              <p className="font-semibold text-gray-900 font-mono text-xs mt-1">{payout.vendor_id}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Amount</p>
              <p className="font-semibold text-gray-900 text-lg">₹{payout.amount}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Payment Method</p>
              <p className="font-semibold text-gray-900">{payout.payment_method}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Date Requested</p>
              <p className="font-semibold text-gray-900">{payout.created_at ? new Date(payout.created_at).toLocaleString() : '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 font-medium">Payment Details / Account Info</p>
              <pre className="font-mono text-xs text-gray-900 bg-gray-50 p-2 rounded border mt-1">
                {JSON.stringify(payout.payment_details, null, 2) || 'Direct Bank Transfer'}
              </pre>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 font-medium">Current Status</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                payout.status === 'PAID' || payout.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                payout.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {payout.status}
              </span>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="transactionRef">Transaction Reference / UTR Number (For Approval)</Label>
              <Input 
                id="transactionRef" 
                placeholder="e.g. UTR1238918239123" 
                value={transactionRef} 
                onChange={(e) => setTransactionRef(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason (If rejecting)</Label>
              <Input 
                id="rejectionReason" 
                placeholder="e.g. Incorrect bank account information" 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50" 
              onClick={() => handleAction('REJECTED')}
              disabled={processing}
            >
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject Payout
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={() => handleAction('APPROVED')}
              disabled={processing}
            >
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Approve & Mark Paid
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
