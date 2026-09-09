const fs = require('fs');

const path = 'Niklo_Bus_Service.postman_collection.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

function updateRequest(name, method, newBody) {
  for (const folder of data.item) {
    for (const item of folder.item) {
      if (item.name === name && item.request.method === method) {
        if (!item.request.body) {
          item.request.body = { mode: 'raw', options: { raw: { language: 'json' } } };
        }
        item.request.body.raw = JSON.stringify(newBody, null, 4);
      }
    }
  }
}

// Operators
updateRequest('create', 'POST', {
  name: 'Greenline Travels',
  logo_url: 'https://example.com/greenline.png',
  contact_phone: '+919876543210',
  contact_email: 'hello@greenline.com',
  gst_number: '22AAAAA0000A1Z5'
});
updateRequest('update', 'PATCH', {
  is_active: true,
  name: 'Greenline Travels Updated',
  contact_phone: '+919876543211'
});

// Routes
updateRequest('create', 'POST', {
  source_city: 'Kolkata',
  destination_city: 'Siliguri',
  distance_km: 580,
  estimated_duration_minutes: 720,
  boarding_points: [
    {
      name: 'Esplanade',
      address: 'Esplanade Bus Stand, Kolkata',
      landmark: 'Metro Gate 4',
      latitude: 22.5645,
      longitude: 88.3433,
      contact_phone: '+919876543210',
      order_index: 1
    }
  ],
  dropping_points: [
    {
      name: 'Siliguri Junction',
      address: 'Tenzing Norgay Bus Terminus, Siliguri',
      landmark: 'Junction Gate',
      latitude: 26.7271,
      longitude: 88.4315,
      contact_phone: '+919876543211',
      order_index: 1
    }
  ]
});

// Buses
updateRequest('create', 'POST', {
  operator_id: '123e4567-e89b-12d3-a456-426614174000',
  registration_number: 'WB11C1234',
  bus_type: 'AC_SLEEPER',
  total_seats: 40,
  amenities: { wifi: true, charging_point: true, water_bottle: true }
});

// Schedules
updateRequest('create', 'POST', {
  route_id: '123e4567-e89b-12d3-a456-426614174001',
  bus_id: '123e4567-e89b-12d3-a456-426614174002',
  operator_id: '123e4567-e89b-12d3-a456-426614174003',
  departure_time: '20:00:00',
  arrival_time: '08:00:00',
  departure_date: '2026-08-28',
  base_fare: 1200,
  available_seats: 40
});
updateRequest('update', 'PATCH', {
  status: 'SCHEDULED',
  base_fare: 1500,
  available_seats: 38
});
updateRequest('lockSeat', 'POST', {
  seat_numbers: ['1A', '1B'],
  user_id: '11111111-1111-1111-1111-111111111111'
});
updateRequest('confirmSeats', 'POST', {
  seat_numbers: ['1A', '1B']
});

// Drivers
updateRequest('create', 'POST', {
  operator_id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Ramesh Singh',
  phone: '+919876543212',
  license_number: 'DL-1420110012345',
  address: '123 Driver St, Kolkata',
  is_active: true
});

// Popular Routes
updateRequest('createPopularRoute', 'POST', {
  source: 'Kolkata',
  destination: 'Siliguri',
  duration: '12h 00m',
  start_price: 1200,
  tag: 'Most Booked',
  priority: 1
});

fs.writeFileSync(path, JSON.stringify(data, null, 4));
console.log('Postman collection updated successfully!');
