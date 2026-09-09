import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusDriver } from './entities/driver.entity';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(BusDriver)
    private readonly driverRepo: Repository<BusDriver>,
  ) {}

  async create(dto: any): Promise<BusDriver> {
    const driver = new BusDriver();
    Object.assign(driver, dto);
    return this.driverRepo.save(driver);
  }

  async findAll(operatorId?: string): Promise<BusDriver[]> {
    if (operatorId) {
      return this.driverRepo.find({ where: { operator_id: operatorId } });
    }
    return this.driverRepo.find();
  }

  async findOne(id: string): Promise<BusDriver> {
    const driver = await this.driverRepo.findOne({ where: { id } });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async update(id: string, dto: any): Promise<BusDriver> {
    const driver = await this.findOne(id);
    Object.assign(driver, dto);
    return this.driverRepo.save(driver);
  }

  async remove(id: string): Promise<void> {
    const driver = await this.findOne(id);
    await this.driverRepo.remove(driver);
  }
}
