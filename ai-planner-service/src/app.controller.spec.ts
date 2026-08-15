import { Test, TestingModule } from '@nestjs/testing';
import { AppController, HealthController } from './app.controller';
import { AppService } from './app.service';

describe('AI Planner Controllers', () => {
  let appController: AppController;
  let healthController: HealthController;
  let appService: Partial<Record<keyof AppService, jest.Mock>>;

  beforeEach(async () => {
    appService = {
      planJourney: jest.fn().mockResolvedValue({
        search_id: 'search_plan_123',
        source: 'Kolkata',
        destination: 'Gangtok',
        travel_date: '2026-08-15',
        passengers: 2,
        options: [],
      }),
      bookMultiModal: jest.fn().mockResolvedValue({
        master_booking_id: 'mbk_991823101',
        journey_id: 'jny_opt_cheapest_01',
        total_amount: 4740.0,
        currency: 'INR',
        status: 'PENDING_PAYMENT',
      }),
      getSavedJourneys: jest.fn().mockResolvedValue([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey_id: 'jny_opt_cheapest_01',
          title: 'Weekend Gangtok Trip',
        },
      ]),
      saveJourney: jest.fn().mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        journey_id: 'jny_opt_cheapest_01',
      }),
      deleteSavedJourney: jest.fn().mockResolvedValue(true),
      getAlerts: jest.fn().mockResolvedValue({
        departure_reminder: true,
        price_drop_alert: true,
        delay_notification: true,
        boarding_gate_update: false,
      }),
      updateAlerts: jest.fn().mockResolvedValue({
        departure_reminder: true,
        price_drop_alert: false,
        delay_notification: true,
        boarding_gate_update: false,
      }),
      optimizeSchedule: jest.fn().mockResolvedValue({
        recommended_departure: '2026-08-15T21:45:00Z',
        recommended_buffer_minutes: 30,
        traffic_condition: 'HEAVY',
        weather_condition: 'LIGHT_RAIN',
        reasoning: 'Traffic on EM Bypass is heavy.',
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController, HealthController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    appController = app.get<AppController>(AppController);
    healthController = app.get<HealthController>(HealthController);
  });

  describe('HealthController', () => {
    it('should return status ok', () => {
      expect(healthController.health()).toEqual({ status: 'ok' });
    });
  });

  describe('AppController', () => {
    it('planJourney should return calculated options', async () => {
      const res = await appController.planJourney({
        source_location: { name: 'Kolkata' },
        destination_location: { name: 'Gangtok' },
        travel_date: '2026-08-15',
        passengers_count: 2,
      });
      expect(res.success).toBe(true);
      expect(res.data.search_id).toBe('search_plan_123');
    });

    it('bookMultiModal should return booking confirmation', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.bookMultiModal(req, {
        search_id: 'search_plan_123',
        journey_id: 'jny_opt_cheapest_01',
        passengers: [{ name: 'Arjun' }],
      });
      expect(res.success).toBe(true);
      expect(res.data.master_booking_id).toBe('mbk_991823101');
    });

    it('getSavedJourneys should return list', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.getSavedJourneys(req);
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
    });

    it('saveJourney should return saved confirmation', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.saveJourney(req, {
        search_id: 'search_plan_123',
        journey_id: 'jny_opt_cheapest_01',
      });
      expect(res.success).toBe(true);
      expect(res.data.journey_id).toBe('jny_opt_cheapest_01');
    });

    it('deleteSavedJourney should delete by id', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.deleteSavedJourney(req, 'jny_opt_cheapest_01');
      expect(res.success).toBe(true);
    });

    it('getAlerts should return alerts map', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.getAlerts(req);
      expect(res.success).toBe(true);
      expect(res.data.departure_reminder).toBe(true);
    });

    it('updateAlerts should update alerts map', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.updateAlerts(req, { departure_reminder: true });
      expect(res.success).toBe(true);
    });

    it('optimizeSchedule should return buffer reasoning', async () => {
      const res = await appController.optimizeSchedule({
        origin: 'Kolkata',
        destination: 'Gangtok',
        scheduled_departure: '2026-08-15T22:15:00Z',
      });
      expect(res.success).toBe(true);
      expect(res.data.recommended_buffer_minutes).toBe(30);
    });
  });
});
