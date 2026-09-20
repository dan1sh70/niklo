'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users, Ticket, CheckSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const downloadCsv = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }
    
    // Extract headers
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          return `"${value.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${filename} exported successfully!`);
  };

  const handleExport = async (endpoint: string, filename: string) => {
    const toastId = toast.loading(`Preparing ${filename} export...`);
    try {
      const res = await apiClient.get(endpoint);
      if (res.data && Array.isArray(res.data)) {
        downloadCsv(res.data, filename);
      } else {
        toast.error('Data format is invalid or empty');
      }
    } catch (err) {
      toast.error(`Failed to export ${filename}`);
      console.error(err);
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Reports</h1>
          <p className="text-muted-foreground mt-1">Export platform data to CSV for analysis and compliance.</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Users & Customers
            </CardTitle>
            <CardDescription>Export a list of all registered customers on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => handleExport('/admin/users', 'Users_Report')}>
              <Download className="w-4 h-4 mr-2" /> Export to CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-emerald-500" />
              All Bookings
            </CardTitle>
            <CardDescription>Detailed export of all bookings including PNRs and statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => handleExport('/admin/bookings', 'Bookings_Report')}>
              <Download className="w-4 h-4 mr-2" /> Export to CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              Vendors & Supply
            </CardTitle>
            <CardDescription>Extract all active and pending vendors.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => handleExport('/admin/vendors', 'Vendors_Report')}>
              <Download className="w-4 h-4 mr-2" /> Export to CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-rose-500" />
              Maker-Checker Approvals
            </CardTitle>
            <CardDescription>Log of all financial approvals and rejections.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => handleExport('/admin/approvals', 'Approvals_Log')}>
              <Download className="w-4 h-4 mr-2" /> Export to CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Audit Trails
            </CardTitle>
            <CardDescription>Complete platform audit logs for security review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => handleExport('/admin/audit-logs', 'Audit_Logs')}>
              <Download className="w-4 h-4 mr-2" /> Export to CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
