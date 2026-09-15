'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Loader2 } from 'lucide-react';
import { payoutsApi, type Payout } from '@/lib/api';
import { toast } from 'sonner';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    payoutsApi.findAll()
      .then(setPayouts)
      .catch(() => toast.error('Failed to load payout requests'))
      .finally(() => setLoading(false));
  }, []);

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
        <h2 className="text-2xl font-bold tracking-tight">Payout Requests</h2>
      </div>

      <div className="bg-white border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Vendor ID / Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No payout requests found.
                </TableCell>
              </TableRow>
            ) : (
              payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-medium font-mono text-xs text-gray-800">{payout.vendor_id}</TableCell>
                  <TableCell className="font-semibold text-gray-900">₹{payout.amount}</TableCell>
                  <TableCell>{payout.payment_method}</TableCell>
                  <TableCell>{payout.created_at ? new Date(payout.created_at).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      payout.status === 'PAID' || payout.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                      payout.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {payout.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/payouts/${payout.id}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-blue-500" />
                        </Button>
                      </Link>
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
