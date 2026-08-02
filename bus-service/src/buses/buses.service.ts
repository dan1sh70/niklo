import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bus } from './entities/bus.entity';
import { SeatLayout } from './entities/seat-layout.entity';
import { Operator } from '../operators/entities/operator.entity';
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
    @InjectRepository(Operator)
    private readonly operatorRepo: Repository<Operator>,
  ) {}

  async create(dto: CreateBusDto): Promise<Bus> {
    // Checked here rather than left to the foreign key, which surfaces as a
    // raw 500 carrying the Postgres constraint name back to the caller.
    const operatorExists = await this.operatorRepo.exists({
      where: { id: dto.operator_id },
    });
    if (!operatorExists) {
      throw new BadRequestException('Operator not found');
    }

    await this.assertRegistrationFree(dto.registration_number);

    const bus = this.busRepo.create(dto);
    return this.busRepo.save(bus);
  }

  /**
   * `registration_number` is unique in the schema, and letting Postgres be the
   * one to say so surfaced as a bare 500 with no message — indistinguishable,
   * from the caller's side, from the service being broken.
   */
  private async assertRegistrationFree(
    registrationNumber: string,
    exceptBusId?: string,
  ): Promise<void> {
    const existing = await this.busRepo.findOne({
      where: { registration_number: registrationNumber },
      select: { id: true },
    });
    if (existing && existing.id !== exceptBusId) {
      throw new ConflictException(
        `A bus is already registered with number ${registrationNumber}`,
      );
    }
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
    if (dto.registration_number) {
      await this.assertRegistrationFree(dto.registration_number, id);
    }
    Object.assign(bus, dto);
    return this.busRepo.save(bus);
  }

  async bulkCreateSeats(
    busId: string,
    dto: BulkCreateSeatsDto,
  ): Promise<SeatLayout[]> {
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
