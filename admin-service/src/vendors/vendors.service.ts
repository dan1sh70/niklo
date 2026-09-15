import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
  ) {}

  async findAll(): Promise<Vendor[]> {
    return this.vendorRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOneBy({ id });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return vendor;
  }

  async create(dto: CreateVendorDto): Promise<Vendor> {
    const vendor = this.vendorRepo.create(dto);
    return this.vendorRepo.save(vendor);
  }

  async update(id: string, dto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(id);
    Object.assign(vendor, dto);
    return this.vendorRepo.save(vendor);
  }

  async remove(id: string): Promise<void> {
    const vendor = await this.findOne(id);
    await this.vendorRepo.remove(vendor);
  }
}
