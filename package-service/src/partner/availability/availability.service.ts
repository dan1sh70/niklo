import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackageTimeSlot } from './entities/adventure-time-slot.entity';
import { PackageSlotRecurrence } from './entities/adventure-slot-recurrence.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';

const RECURRENCE_MAP: Record<string, number[]> = {
  Daily: [1, 2, 3, 4, 5, 6, 7],
  Weekdays: [1, 2, 3, 4, 5],
  Weekends: [6, 7],
};

function getSlotStatus(bookedCount: number, totalCapacity: number, isClosed: boolean) {
  if (isClosed) return { status: 'closed', statusText: 'Closed' };
  const ratio = totalCapacity > 0 ? bookedCount / totalCapacity : 0;
  if (ratio >= 1) return { status: 'full', statusText: 'Full' };
  if (ratio >= 0.8) return { status: 'almostFull', statusText: 'Almost Full' };
  return { status: 'available', statusText: 'Available' };
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(PackageTimeSlot)
    private readonly slotRepo: Repository<PackageTimeSlot>,
    @InjectRepository(PackageSlotRecurrence)
    private readonly recurrenceRepo: Repository<PackageSlotRecurrence>,
    @InjectRepository(PackagePartner)
    private readonly partnerRepo: Repository<PackagePartner>,
  ) {}

  private async resolvePartnerId(userId: string): Promise<string> {
    const partner = await this.partnerRepo.findOne({ where: { user_id: userId } });
    if (!partner) throw new NotFoundException('Partner profile not found.');
    return partner.id;
  }

  async getSlotsForDate(userId: string, date: string, activityId?: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const qb = this.slotRepo.createQueryBuilder('s')
      .where('s.partner_id = :partnerId', { partnerId })
      .andWhere('s.slot_date = :date', { date });
    if (activityId) qb.andWhere('s.activity_id = :activityId', { activityId });

    const slots = await qb.orderBy('s.start_time', 'ASC').getMany();

    const totalBooked = slots.reduce((s, sl) => s + sl.booked_count, 0);
    const totalCapacity = slots.reduce((s, sl) => s + sl.total_capacity, 0);

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' });

    return {
      date,
      formattedDate,
      summary: {
        totalSlots: slots.length,
        totalBooked,
        totalCapacity,
        occupancyRate: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 1000) / 10 : 0,
      },
      slots: slots.map((s) => {
        const { status, statusText } = getSlotStatus(s.booked_count, s.total_capacity, s.is_closed);
        return {
          id: s.id,
          time: s.start_time,
          endTime: s.end_time,
          statusText,
          status,
          bookedCount: s.booked_count,
          totalCapacity: s.total_capacity,
          bookingRatio: s.total_capacity > 0 ? Math.round((s.booked_count / s.total_capacity) * 100) / 100 : 0,
          instructor: s.instructor_name,
          price: Number(s.price_per_person),
          isClosed: s.is_closed,
        };
      }),
    };
  }

  async getMonthSummary(userId: string, year: number, month: number) {
    const partnerId = await this.resolvePartnerId(userId);
    const paddedMonth = String(month).padStart(2, '0');
    const datePrefix = `${year}-${paddedMonth}`;

    const slots = await this.slotRepo.createQueryBuilder('s')
      .where('s.partner_id = :partnerId', { partnerId })
      .andWhere(`s.slot_date LIKE '${datePrefix}%'`)
      .getMany();

    const dayMap: Record<string, { totalBooked: number; totalCapacity: number; count: number }> = {};
    slots.forEach((s) => {
      if (!dayMap[s.slot_date]) dayMap[s.slot_date] = { totalBooked: 0, totalCapacity: 0, count: 0 };
      dayMap[s.slot_date].totalBooked += s.booked_count;
      dayMap[s.slot_date].totalCapacity += s.total_capacity;
      dayMap[s.slot_date].count += 1;
    });

    const today = new Date().toISOString().split('T')[0];
    const days = Object.entries(dayMap).map(([date, info]) => ({
      date,
      isPast: date < today,
      slotsCount: info.count,
      totalBooked: info.totalBooked,
      totalCapacity: info.totalCapacity,
    }));

    const monthDate = new Date(year, month - 1, 1);
    return {
      monthYear: monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      days,
    };
  }

  async createSlot(userId: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const today = new Date().toISOString().split('T')[0];
    if (dto.date < today) throw new BadRequestException({ errorCode: 'PAST_DATE_NOT_ALLOWED', message: 'Cannot schedule a slot in the past' });

    if (dto.repeatSlot && dto.repeatInterval) {
      // Create recurrence record
      const interval = dto.repeatInterval?.toUpperCase?.().replace(' ', '') || 'DAILY';
      const recurrence = this.recurrenceRepo.create({
        partner_id: partnerId,
        activity_id: dto.activityId,
        recurrence_interval: interval === 'WEEKDAYS' ? 'WEEKDAYS' : interval === 'WEEKENDS' ? 'WEEKENDS' : interval === 'CUSTOM' ? 'CUSTOM' : 'DAILY',
        custom_days: dto.customDays || [],
        start_date: dto.date,
        end_date: dto.repeatUntilDate || null,
        start_time: dto.startTime,
        end_time: dto.endTime,
        capacity: dto.capacity,
        price_per_person: dto.price,
        instructor_name: dto.instructor || null,
      });
      const savedRec = await this.recurrenceRepo.save(recurrence);

      // Generate slots
      const days = RECURRENCE_MAP[dto.repeatInterval] || [1, 2, 3, 4, 5, 6, 7];
      const endDate = dto.repeatUntilDate ? new Date(dto.repeatUntilDate) : new Date(dto.date);
      if (!dto.repeatUntilDate) endDate.setDate(endDate.getDate() + 60);

      const slotsToCreate: any[] = [];
      const cursor = new Date(dto.date);
      while (cursor <= endDate) {
        const dayOfWeek = cursor.getDay() === 0 ? 7 : cursor.getDay();
        if (days.includes(dayOfWeek)) {
          slotsToCreate.push(this.slotRepo.create({
            partner_id: partnerId,
            activity_id: dto.activityId,
            slot_date: cursor.toISOString().split('T')[0],
            start_time: dto.startTime,
            end_time: dto.endTime,
            slot_title: dto.slotTitle || null,
            total_capacity: dto.capacity,
            price_per_person: dto.price,
            instructor_name: dto.instructor || 'Not Assigned',
            is_recurring: true,
            recurrence_id: savedRec.id,
          }));
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      const savedSlots = await this.slotRepo.save(slotsToCreate);
      return {
        slotId: savedSlots[0]?.id,
        isRecurring: true,
        generatedSlotsCount: savedSlots.length,
        date: dto.date,
        time: `${dto.startTime} - ${dto.endTime}`,
      };
    } else {
      const slot = this.slotRepo.create({
        partner_id: partnerId,
        activity_id: dto.activityId,
        slot_date: dto.date,
        start_time: dto.startTime,
        end_time: dto.endTime,
        slot_title: dto.slotTitle || null,
        total_capacity: dto.capacity,
        price_per_person: dto.price,
        instructor_name: dto.instructor || 'Not Assigned',
      });
      const saved = await this.slotRepo.save(slot);
      return { slotId: saved.id, isRecurring: false, generatedSlotsCount: 1, date: dto.date, time: `${dto.startTime} - ${dto.endTime}` };
    }
  }

  async updateSlot(userId: string, id: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const slot = await this.slotRepo.findOneBy({ id });
    if (!slot) throw new NotFoundException('SLOT_NOT_FOUND');
    if (slot.partner_id !== partnerId) throw new ForbiddenException('SLOT_NOT_OWNED');
    if (dto.capacity !== undefined && dto.capacity < slot.booked_count) {
      throw new ConflictException({ errorCode: 'CAPACITY_LESS_THAN_BOOKED', message: `Cannot reduce capacity below ${slot.booked_count} booked seats` });
    }

    const update: any = {};
    if (dto.capacity !== undefined) update.total_capacity = dto.capacity;
    if (dto.price !== undefined) update.price_per_person = dto.price;
    if (dto.instructor !== undefined) update.instructor_name = dto.instructor;
    await this.slotRepo.update(id, update);

    return { id, totalCapacity: dto.capacity ?? slot.total_capacity, price: dto.price ?? slot.price_per_person, instructor: dto.instructor ?? slot.instructor_name };
  }

  async toggleSlotStatus(userId: string, id: string, isClosed: boolean) {
    const partnerId = await this.resolvePartnerId(userId);
    const slot = await this.slotRepo.findOneBy({ id });
    if (!slot) throw new NotFoundException('SLOT_NOT_FOUND');
    if (slot.partner_id !== partnerId) throw new ForbiddenException('SLOT_NOT_OWNED');
    await this.slotRepo.update(id, { is_closed: isClosed });
    const { status, statusText } = getSlotStatus(slot.booked_count, slot.total_capacity, isClosed);
    return { id, isClosed, status, statusText };
  }

  async deleteSlot(userId: string, id: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const slot = await this.slotRepo.findOneBy({ id });
    if (!slot) throw new NotFoundException('SLOT_NOT_FOUND');
    if (slot.partner_id !== partnerId) throw new ForbiddenException('SLOT_NOT_OWNED');
    if (slot.booked_count > 0) throw new ConflictException({ errorCode: 'CANNOT_DELETE_BOOKED_SLOT', message: 'Cannot delete a slot with active bookings' });
    await this.slotRepo.delete(id);
  }
}
