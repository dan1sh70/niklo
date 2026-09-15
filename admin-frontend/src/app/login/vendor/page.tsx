import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VendorLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Card className="w-[400px] shadow-xl border-slate-800 bg-slate-800 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-teal-400">Vendor Portal Login</CardTitle>
          <CardDescription className="text-slate-400">Manage your fleet, routes, and earnings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <Input type="email" placeholder="vendor@example.com" className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <Input type="password" placeholder="••••••••" className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white border-none">Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
