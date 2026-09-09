const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, 'Niklo_Booking_Service.postman_collection.json');
let data = {
    info: {
        name: "Niklo Booking Service",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
        { key: "baseUrl", value: "http://localhost:3005", type: "string" },
        { key: "token", value: "your_jwt_token_here", type: "string" }
    ],
    item: []
};

function createFolder(name, endpoints) {
    const items = endpoints.map(ep => {
        const req = {
            method: ep.method,
            header: [
                { key: "Authorization", value: "Bearer {{token}}", type: "text" },
                { key: "Content-Type", value: "application/json", type: "text" }
            ],
            url: {
                raw: `{{baseUrl}}${ep.path}`,
                host: ["{{baseUrl}}"],
                path: ep.path.split('/').filter(p => p)
            }
        };

        if (ep.body) {
            req.body = {
                mode: "raw",
                raw: JSON.stringify(ep.body, null, 4),
                options: { raw: { language: "json" } }
            };
        }

        return {
            name: ep.name,
            request: req,
            response: []
        };
    });

    return { name, item: items };
}

data.item.push(createFolder('Bookings', [
    { name: 'getHistory', method: 'GET', path: '/api/v1/bookings/history' },
    { name: 'getMyBookings', method: 'GET', path: '/api/v1/bookings/my-bookings' },
    { name: 'getIdVerificationStatus', method: 'GET', path: '/api/v1/bookings/:id/id-verification' },
    {
        name: 'getCancellationQuote', method: 'POST', path: '/api/v1/bookings/:id/cancellation-quote'
    },
    {
        name: 'createBooking', method: 'POST', path: '/api/v1/bookings',
        body: {
            booking_type: "BUS",
            schedule_id: "123e4567-e89b-12d3-a456-426614174001",
            title: "Greenline Travels (AC Sleeper)",
            subtitle: "Kolkata to Siliguri",
            boarding_point: "Esplanade, Kolkata",
            dropping_point: "Junction, Siliguri",
            travel_date: "2026-08-28",
            departure_time: "20:00",
            total_amount: 1200,
            has_insurance: true,
            has_gov_id_verification: true,
            primary_gov_id_type: "AADHAAR",
            primary_gov_id_number: "123456789012",
            seat_numbers: ["1A", "1B"],
            passenger_details: [
                {
                    name: "John Doe",
                    age: 30,
                    gender: "MALE",
                    seat_number: "1A"
                },
                {
                    name: "Jane Doe",
                    age: 28,
                    gender: "FEMALE",
                    seat_number: "1B"
                }
            ]
        }
    },
    {
        name: 'confirmPayment', method: 'POST', path: '/api/v1/bookings/:id/confirm-payment',
        body: {
            payment_id: "pay_ABC123XYZ"
        }
    },
    {
        name: 'applyCoupon', method: 'POST', path: '/api/v1/bookings/:id/apply-coupon',
        body: {
            coupon_code: "WELCOME50",
            discount_amount: 50
        }
    },
    {
        name: 'verifyTicket', method: 'POST', path: '/api/v1/bookings/verify-ticket',
        body: {
            token: "eyJhbGciOiJIUzI1Ni..."
        }
    },
    {
        name: 'verifyId', method: 'POST', path: '/api/v1/bookings/verify-id',
        body: {
            booking_id: "123e4567-e89b-12d3-a456-426614174000",
            id_type: "AADHAAR",
            id_number: "123456789012"
        }
    }
]));

fs.writeFileSync(collectionPath, JSON.stringify(data, null, 4));
console.log('Successfully regenerated Niklo_Booking_Service.postman_collection.json!');
