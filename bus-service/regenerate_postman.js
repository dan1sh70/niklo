const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const testToken = jwt.sign(
    { sub: '11111111-1111-1111-1111-111111111111', phone: '+919876543210' }, 
    'super-secret-jwt-key', 
    { expiresIn: '30d' }
);

const collectionPath = path.join(__dirname, 'Niklo_Bus_Service.postman_collection.json');
let data = {
    info: {
        name: "Niklo Bus Service",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
        { key: "baseUrl", value: "http://localhost:3000", type: "string" },
        { key: "token", value: testToken, type: "string" }
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

data.item.push(createFolder('App', [
    { name: 'getHello', method: 'GET', path: '/' }
]));

data.item.push(createFolder('Operators', [
    { name: 'findAll', method: 'GET', path: '/api/v1/bus/operators' },
    { name: 'findOne', method: 'GET', path: '/api/v1/bus/operators/:id' },
    { name: 'getSummary', method: 'GET', path: '/api/v1/bus/operators/:id/summary' },
    { 
        name: 'create', method: 'POST', path: '/api/v1/bus/operators',
        body: {
            name: "Greenline Travels",
            logo_url: "https://example.com/greenline.png",
            contact_phone: "+919876543210",
            contact_email: "hello@greenline.com",
            gst_number: "22AAAAA0000A1Z5"
        }
    },
    { 
        name: 'update', method: 'PATCH', path: '/api/v1/bus/operators/:id',
        body: {
            is_active: true,
            name: "Greenline Travels Updated",
            contact_phone: "+919876543211"
        }
    },
    { name: 'remove', method: 'DELETE', path: '/api/v1/bus/operators/:id' }
]));

data.item.push(createFolder('Routes', [
    { name: 'findAll', method: 'GET', path: '/api/v1/bus/routes' },
    { name: 'findOne', method: 'GET', path: '/api/v1/bus/routes/:id' },
    { name: 'search', method: 'GET', path: '/api/v1/bus/routes/search' },
    {
        name: 'create', method: 'POST', path: '/api/v1/bus/routes',
        body: {
            source_city: "Kolkata",
            destination_city: "Siliguri",
            distance_km: 580,
            estimated_duration_minutes: 720,
            boarding_points: [
                {
                    name: "Esplanade",
                    address: "Esplanade Bus Stand, Kolkata",
                    landmark: "Metro Gate 4",
                    latitude: 22.5645,
                    longitude: 88.3433,
                    contact_phone: "+919876543210",
                    order_index: 1
                }
            ],
            dropping_points: [
                {
                    name: "Siliguri Junction",
                    address: "Tenzing Norgay Bus Terminus, Siliguri",
                    landmark: "Junction Gate",
                    latitude: 26.7271,
                    longitude: 88.4315,
                    contact_phone: "+919876543211",
                    order_index: 1
                }
            ]
        }
    },
    {
        name: 'update', method: 'PATCH', path: '/api/v1/bus/routes/:id',
        body: {
            distance_km: 600,
            estimated_duration_minutes: 750
        }
    },
    { name: 'remove', method: 'DELETE', path: '/api/v1/bus/routes/:id' }
]));

data.item.push(createFolder('Buses', [
    { name: 'findAll', method: 'GET', path: '/api/v1/bus/buses' },
    { name: 'findOne', method: 'GET', path: '/api/v1/bus/buses/:id' },
    { name: 'autocomplete', method: 'GET', path: '/api/v1/bus/buses/locations/autocomplete' },
    { name: 'getSeats', method: 'GET', path: '/api/v1/bus/buses/:id/seats' },
    {
        name: 'create', method: 'POST', path: '/api/v1/bus/buses',
        body: {
            operator_id: "123e4567-e89b-12d3-a456-426614174000",
            registration_number: "WB11C1234",
            bus_type: "AC_SLEEPER",
            total_seats: 40,
            amenities: { wifi: true, charging_point: true, water_bottle: true }
        }
    },
    {
        name: 'update', method: 'PATCH', path: '/api/v1/bus/buses/:id',
        body: {
            is_active: true,
            total_seats: 42
        }
    },
    {
        name: 'bulkCreateSeats', method: 'POST', path: '/api/v1/bus/buses/:id/seats',
        body: {
            seats: [
                {
                    seat_number: "1A",
                    is_upper_deck: false,
                    row_num: 1,
                    col_num: 1,
                    seat_type: "SLEEPER",
                    price_offset: 100,
                    is_available: true,
                    is_ladies_seat: false
                },
                {
                    seat_number: "1B",
                    is_upper_deck: false,
                    row_num: 1,
                    col_num: 2,
                    seat_type: "SLEEPER",
                    price_offset: 0,
                    is_available: true,
                    is_ladies_seat: true
                }
            ]
        }
    },
    { name: 'remove', method: 'DELETE', path: '/api/v1/bus/buses/:id' }
]));

data.item.push(createFolder('Schedules', [
    { name: 'findAll', method: 'GET', path: '/api/v1/bus/schedules' },
    { name: 'findOne', method: 'GET', path: '/api/v1/bus/schedules/:id' },
    { name: 'search', method: 'GET', path: '/api/v1/bus/schedules/search' },
    { name: 'getSeatMap', method: 'GET', path: '/api/v1/bus/schedules/:id/seat-map' },
    { name: 'getBoardingPoints', method: 'GET', path: '/api/v1/bus/schedules/:id/boarding-points' },
    { name: 'getManifest', method: 'GET', path: '/api/v1/bus/schedules/:id/manifest' },
    {
        name: 'create', method: 'POST', path: '/api/v1/bus/schedules',
        body: {
            route_id: "123e4567-e89b-12d3-a456-426614174001",
            bus_id: "123e4567-e89b-12d3-a456-426614174002",
            operator_id: "123e4567-e89b-12d3-a456-426614174003",
            departure_time: "20:00:00",
            arrival_time: "08:00:00",
            departure_date: "2026-08-28",
            base_fare: 1200,
            available_seats: 40
        }
    },
    {
        name: 'update', method: 'PATCH', path: '/api/v1/bus/schedules/:id',
        body: {
            status: "SCHEDULED",
            base_fare: 1500,
            available_seats: 38
        }
    },
    {
        name: 'lockSeat', method: 'POST', path: '/api/v1/bus/schedules/:id/lock-seat',
        body: {
            seat_numbers: ["1A", "1B"],
            user_id: "11111111-1111-1111-1111-111111111111"
        }
    },
    {
        name: 'confirmSeats', method: 'POST', path: '/api/v1/bus/schedules/:id/confirm-seats',
        body: {
            seat_numbers: ["1A", "1B"]
        }
    },
    { name: 'remove', method: 'DELETE', path: '/api/v1/bus/schedules/:id' }
]));

data.item.push(createFolder('Drivers', [
    { name: 'findAll', method: 'GET', path: '/api/v1/bus/drivers' },
    { name: 'findOne', method: 'GET', path: '/api/v1/bus/drivers/:id' },
    {
        name: 'create', method: 'POST', path: '/api/v1/bus/drivers',
        body: {
            operator_id: "123e4567-e89b-12d3-a456-426614174000",
            name: "Ramesh Singh",
            phone: "+919876543212",
            license_number: "DL-1420110012345",
            address: "123 Driver St, Kolkata",
            is_active: true
        }
    },
    {
        name: 'update', method: 'PATCH', path: '/api/v1/bus/drivers/:id',
        body: {
            name: "Ramesh Kumar Singh",
            is_active: false
        }
    },
    { name: 'remove', method: 'DELETE', path: '/api/v1/bus/drivers/:id' }
]));

data.item.push(createFolder('Locations', [
    { name: 'autocomplete', method: 'GET', path: '/api/v1/bus/locations/autocomplete' }
]));

data.item.push(createFolder('PopularRoutes', [
    { name: 'getPopularRoutes', method: 'GET', path: '/api/v1/bus/popular-routes' },
    {
        name: 'createPopularRoute', method: 'POST', path: '/api/v1/bus/popular-routes',
        body: {
            source: "Kolkata",
            destination: "Siliguri",
            duration: "12h 00m",
            start_price: 1200,
            tag: "Most Booked",
            priority: 1
        }
    }
]));

fs.writeFileSync(collectionPath, JSON.stringify(data, null, 4));
console.log('Successfully regenerated Niklo_Bus_Service.postman_collection.json!');
