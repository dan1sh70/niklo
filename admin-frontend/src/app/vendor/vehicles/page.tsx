import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function FleetPage() {
  const vehicles = [
    { id: '1', name: 'Volvo 9400 B11R', number: 'DL 01 AB 1234', type: 'AC Sleeper', capacity: 36, status: 'Active' },
    { id: '2', name: 'Scania Metrolink', number: 'HR 26 XY 9876', type: 'AC Seater', capacity: 45, status: 'Maintenance' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">My Fleet</h2>
        <Link href="/vendor/vehicles/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Vehicle Name / Model</TableHead>
              <TableHead>Registration No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.name}</TableCell>
                <TableCell>{vehicle.number}</TableCell>
                <TableCell>{vehicle.type}</TableCell>
                <TableCell>{vehicle.capacity} seats</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    vehicle.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {vehicle.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/vendor/vehicles/${vehicle.id}`}>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Edit2 className="h-4 w-4 text-teal-600" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
