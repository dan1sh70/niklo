import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bus } from './entities/bus.entity';
import { SeatLayout } from './entities/seat-layout.entity';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { BulkCreateSeatsDto } from './dto/create-seat.dto';

@Injectable()
export class BusesService {
  constructor(
    @InjectRepository(Bus)
    private readonly busRepo: Repository<Bus>,
    @InjectRepository(SeatLayout)
    private readonly seatRepo: Repository<SeatLayout>,
  ) {}

  async create(dto: CreateBusDto): Promise<Bus> {
    const bus = this.busRepo.create(dto);
    return this.busRepo.save(bus);
  }

  async findAll(operatorId?: string): Promise<Bus[]> {
    const where: any = { is_active: true };
    if (operatorId) where.operator_id = operatorId;
    return this.busRepo.find({ where, relations: { operator: true } });
  }

  async findOne(id: string): Promise<Bus> {
    const bus = await this.busRepo.findOne({
      where: { id },
      relations: { operator: true, seats: true },
    });
    if (!bus) throw new NotFoundException('Bus not found');
    return bus;
  }

  async update(id: string, dto: UpdateBusDto): Promise<Bus> {
    const bus = await this.findOne(id);
    Object.assign(bus, dto);
    return this.busRepo.save(bus);
  }

  async bulkCreateSeats(busId: string, dto: BulkCreateSeatsDto): Promise<SeatLayout[]> {
    // Verify bus exists
    await this.findOne(busId);

    // Delete existing seats for this bus
    await this.seatRepo.delete({ bus_id: busId });

    // Create new seats
    const seats = dto.seats.map((seat) =>
      this.seatRepo.create({ ...seat, bus_id: busId }),
    );
    return this.seatRepo.save(seats);
  }

  async getSeats(busId: string): Promise<SeatLayout[]> {
    return this.seatRepo.find({
      where: { bus_id: busId },
      order: { deck: 'ASC', row: 'ASC', column: 'ASC' },
    });
  }
}
