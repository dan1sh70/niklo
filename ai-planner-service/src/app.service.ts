import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiJourneyPlan } from './entities/ai-journey-plan.entity';
import { UserSavedJourney } from './entities/user-saved-journey.entity';
import { JourneyAlert } from './entities/journey-alert.entity';
import {
  PlanJourneyDto,
  BookMultiModalDto,
  SaveJourneyDto,
  UpdateAlertsDto,
  OptimizeScheduleDto,
} from './dto/ai-planner.dto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(AiJourneyPlan)
    private journeyPlanRepo: Repository<AiJourneyPlan>,
    @InjectRepository(UserSavedJourney)
    private savedJourneyRepo: Repository<UserSavedJourney>,
    @InjectRepository(JourneyAlert)
    private journeyAlertRepo: Repository<JourneyAlert>,
  ) {}

  async planJourney(dto: PlanJourneyDto) {
    this.logger.log(`Planning journey from ${dto.source_location.name} to ${dto.destination_location.name}`);
    
    // We are mocking the algorithmic output as defined by the backend specification
    const search_id = `search_plan_${Math.floor(Math.random() * 100000000)}`;
    const options = [
      {
        journey_id: 'jny_opt_cheapest_01',
        category: 'CHEAPEST',
        badge_label: 'BEST VALUE',
        title: 'Cab + Intercity Bus + Hill Cab',
        total_fare: 4740.00,
        fare_per_passenger: 2370.00,
        currency: 'INR',
        total_duration: '12h 40m',
        total_transfers: 2,
        start_time: '2026-08-15T22:15:00Z',
        end_time: '2026-08-16T10:55:00Z',
        transport_modes: ['CAB', 'BUS', 'CAB'],
        legs: [
          {
            leg_index: 1,
            mode: 'CAB',
            mode_label: 'First-Mile Cab',
            origin: dto.source_location.name,
            destination: 'Esplanade Bus Terminus, Kolkata',
            departure_time: '2026-08-15T22:15:00Z',
            arrival_time: '2026-08-15T22:50:00Z',
            duration: '35m',
            distance_km: 14.2,
            estimated_fare: 320.00,
            service_provider: 'Niklo Cabs',
            booking_payload: {
              ride_type: 'SEDAN',
              pickup_lat: dto.source_location.latitude,
              pickup_lng: dto.source_location.longitude,
              drop_lat: 22.5645,
              drop_lng: 88.3512,
            },
          },
          {
            leg_index: 2,
            mode: 'TRANSFER',
            mode_label: 'Transfer & Boarding',
            location: 'Esplanade Bus Terminus, Kolkata',
            duration: '25m',
            instruction: 'Walk to Platform 4 for Greenline AC Sleeper',
          },
          {
            leg_index: 3,
            mode: 'BUS',
            mode_label: 'Intercity AC Sleeper Bus',
            origin: 'Esplanade, Kolkata',
            destination: 'Siliguri Junction Bus Stand',
            departure_time: '2026-08-15T23:15:00Z',
            arrival_time: '2026-08-16T07:15:00Z',
            duration: '8h 00m',
            distance_km: 560.0,
            estimated_fare: 2400.00,
            service_provider: 'Greenline Express',
            schedule_id: 'sch_kol_sil_099',
            available_seats: ['L4C', 'L5C'],
          },
          {
            leg_index: 4,
            mode: 'TRANSFER',
            mode_label: 'Transfer & Breakfast',
            location: 'Siliguri Junction Bus Stand',
            duration: '30m',
            instruction: 'Head to Taxi Stand opposite Railway Station',
          },
          {
            leg_index: 5,
            mode: 'CAB',
            mode_label: 'Hill Shared/Private Taxi',
            origin: 'Siliguri Junction, West Bengal',
            destination: dto.destination_location.name,
            departure_time: '2026-08-16T07:45:00Z',
            arrival_time: '2026-08-16T10:55:00Z',
            duration: '3h 10m',
            distance_km: 114.0,
            estimated_fare: 2020.00,
            service_provider: 'Sikkim Taxi Union',
            booking_payload: {
              ride_type: 'SUV_HILL',
              pickup_lat: 26.7271,
              pickup_lng: 88.4315,
              drop_lat: dto.destination_location.latitude,
              drop_lng: dto.destination_location.longitude,
            },
          },
        ],
      },
      {
        journey_id: 'jny_opt_comfort_02',
        category: 'MOST_COMFORTABLE',
        badge_label: 'DIRECT COMFORT',
        title: 'Direct Luxury SUV Cab',
        total_fare: 8500.00,
        fare_per_passenger: 4250.00,
        currency: 'INR',
        total_duration: '11h 30m',
        total_transfers: 0,
        start_time: '2026-08-15T06:00:00Z',
        end_time: '2026-08-15T17:30:00Z',
        transport_modes: ['CAB'],
        legs: [
          {
            leg_index: 1,
            mode: 'CAB',
            mode_label: 'Door-to-Door SUV Cab',
            origin: dto.source_location.name,
            destination: dto.destination_location.name,
            departure_time: '2026-08-15T06:00:00Z',
            arrival_time: '2026-08-15T17:30:00Z',
            duration: '11h 30m',
            distance_km: 674.0,
            estimated_fare: 8500.00,
            service_provider: 'Niklo Outstation Cab',
            booking_payload: {
              ride_type: 'INNOVA_CRYSTA',
              pickup_lat: dto.source_location.latitude,
              pickup_lng: dto.source_location.longitude,
              drop_lat: dto.destination_location.latitude,
              drop_lng: dto.destination_location.longitude,
            },
          },
        ],
      },
    ];

    // Save generated plan to DB
    await this.journeyPlanRepo.save({
      search_id,
      source_name: dto.source_location.name,
      source_lat: dto.source_location.latitude,
      source_lng: dto.source_location.longitude,
      destination_name: dto.destination_location.name,
      destination_lat: dto.destination_location.latitude,
      destination_lng: dto.destination_location.longitude,
      travel_date: dto.travel_date,
      passengers_count: dto.passengers_count,
      options_json: options,
    });

    return {
      search_id,
      source: dto.source_location.name,
      destination: dto.destination_location.name,
      travel_date: dto.travel_date,
      passengers: dto.passengers_count,
      options,
    };
  }

  async bookMultiModal(userId: string, dto: BookMultiModalDto) {
    this.logger.log(`Executing multi-modal booking for user ${userId}, search ${dto.search_id}`);
    
    // In a real app, this would orchestrate distributed transactions across multiple microservices.
    // For now, we return the specified mock confirmation.
    return {
      master_booking_id: `mbk_${Math.floor(Math.random() * 1000000000)}`,
      journey_id: dto.journey_id,
      total_amount: 4740.00, // mock price
      currency: 'INR',
      status: 'PENDING_PAYMENT',
      leg_bookings: [
        { leg_index: 1, mode: 'CAB', booking_id: 'cab_bk_012', status: 'RESERVED', amount: 320.00 },
        { leg_index: 3, mode: 'BUS', booking_id: 'bus_bk_881', status: 'SEATS_LOCKED', seat_numbers: dto.selected_bus_seats || ['L4C', 'L5C'], amount: 2400.00 },
        { leg_index: 5, mode: 'CAB', booking_id: 'cab_bk_013', status: 'RESERVED', amount: 2020.00 }
      ],
      checkout_order: {
        razorpay_order_id: `order_K${Math.floor(Math.random() * 1000000000)}`,
        amount: 4740.00,
        currency: 'INR',
        key_id: 'rzp_test_NikloKey123'
      }
    };
  }

  async getSavedJourneys(userId: string) {
    const journeys = await this.savedJourneyRepo.find({ where: { user_id: userId } });
    
    return journeys.map(j => ({
      id: j.id,
      journey_id: j.journey_id,
      search_id: j.search_id,
      source_name: j.source_name,
      destination_name: j.destination_name,
      title: j.title,
      category: j.category,
      total_fare: Number(j.total_fare),
      total_duration: j.total_duration,
      total_transfers: j.total_transfers,
      saved_at: j.created_at,
    }));
  }

  async saveJourney(userId: string, dto: SaveJourneyDto) {
    // 1. Fetch the AI Journey Plan to get details
    const plan = await this.journeyPlanRepo.findOne({ where: { search_id: dto.search_id } });
    if (!plan) throw new NotFoundException('Journey plan not found or expired');

    // 2. Find the specific journey option from JSON
    const journeyOption = plan.options_json.find((opt: any) => opt.journey_id === dto.journey_id);
    if (!journeyOption) throw new NotFoundException('Journey option not found in plan');

    // 3. Save it to user's saved journeys
    const newSaved = this.savedJourneyRepo.create({
      user_id: userId,
      journey_id: dto.journey_id,
      search_id: dto.search_id,
      source_name: plan.source_name,
      destination_name: plan.destination_name,
      title: journeyOption.title,
      category: journeyOption.category,
      total_fare: journeyOption.total_fare,
      total_duration: journeyOption.total_duration,
      total_transfers: journeyOption.total_transfers,
      journey_payload: journeyOption,
    });

    const saved = await this.savedJourneyRepo.save(newSaved);

    return {
      id: saved.id,
      journey_id: saved.journey_id,
    };
  }

  async deleteSavedJourney(userId: string, id: string) {
    const result = await this.savedJourneyRepo.delete({ id, user_id: userId });
    if (result.affected === 0) {
      throw new NotFoundException('Saved journey not found');
    }
    return true;
  }

  async getAlerts(userId: string) {
    let alerts = await this.journeyAlertRepo.findOne({ where: { user_id: userId } });
    
    if (!alerts) {
      // Create defaults if they don't exist
      alerts = await this.journeyAlertRepo.save(
        this.journeyAlertRepo.create({ user_id: userId })
      );
    }
    
    return {
      departure_reminder: alerts.departure_reminder,
      price_drop_alert: alerts.price_drop_alert,
      delay_notification: alerts.delay_notification,
      boarding_gate_update: alerts.boarding_gate_update,
      updated_at: alerts.updated_at,
    };
  }

  async updateAlerts(userId: string, dto: UpdateAlertsDto) {
    let alerts = await this.journeyAlertRepo.findOne({ where: { user_id: userId } });
    
    if (!alerts) {
      alerts = this.journeyAlertRepo.create({ user_id: userId, ...dto });
    } else {
      Object.assign(alerts, dto);
    }
    
    const updated = await this.journeyAlertRepo.save(alerts);
    
    return {
      departure_reminder: updated.departure_reminder,
      price_drop_alert: updated.price_drop_alert,
      delay_notification: updated.delay_notification,
      boarding_gate_update: updated.boarding_gate_update,
      updated_at: updated.updated_at,
    };
  }

  async optimizeSchedule(dto: OptimizeScheduleDto) {
    this.logger.log(`Optimizing schedule for ${dto.origin} to ${dto.destination}`);
    
    // In production, queries real-time traffic apis
    return {
      recommended_departure: '2026-08-15T21:45:00Z',
      recommended_buffer_minutes: 30,
      traffic_condition: 'HEAVY',
      weather_condition: 'LIGHT_RAIN',
      reasoning: 'Traffic on EM Bypass is expected to spike between 21:30 and 22:30. Leaving 30 mins early avoids risk of missing the intercity bus.'
    };
  }
}
