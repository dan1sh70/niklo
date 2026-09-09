const fs = require('fs');

const path = 'Niklo_Booking_Service.postman_collection.json';
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

// Bookings
updateRequest('create', 'POST', {
  booking_type: 'BUS',
  schedule_id: '123e4567-e89b-12d3-a456-426614174001',
  title: 'Greenline Travels (AC Sleeper)',
  subtitle: 'Kolkata to Siliguri',
  boarding_point: 'Esplanade, Kolkata',
  dropping_point: 'Junction, Siliguri',
  travel_date: '2026-08-28',
  departure_time: '20:00',
  total_amount: 1200,
  has_insurance: true,
  has_gov_id_verification: true,
  primary_gov_id_type: 'AADHAAR',
  primary_gov_id_number: '123456789012',
  seat_numbers: ['1A', '1B'],
  passenger_details: [
    {
      name: 'John Doe',
      age: 30,
      gender: 'MALE',
      seat_number: '1A'
    },
    {
      name: 'Jane Doe',
      age: 28,
      gender: 'FEMALE',
      seat_number: '1B'
    }
  ]
});

updateRequest('confirmPayment', 'POST', {
  payment_id: 'pay_ABC123XYZ'
});

updateRequest('verifyGovId', 'POST', {
  booking_id: '123e4567-e89b-12d3-a456-426614174000',
  id_type: 'AADHAAR',
  id_number: '123456789012'
});

fs.writeFileSync(path, JSON.stringify(data, null, 4));
console.log('Booking Postman collection updated successfully!');
