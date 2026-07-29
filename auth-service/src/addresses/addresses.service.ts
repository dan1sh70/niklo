import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { SavedAddress } from './entities/saved-address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

/// Saved addresses, with one invariant that every write has to preserve: an
/// account with at least one address has exactly one default.
///
/// The app leans on that. The location search screen resolves its Home and Work
/// shortcuts by taking the first address of a type, and the ride flow prefills
/// the default — two defaults, or none, and those pick silently wrong.
///
/// Every method that can disturb it runs in a transaction. Clearing the old
/// default and setting the new one are two statements; interleaved with another
/// device's write they would otherwise leave zero or two rows flagged.
@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(SavedAddress)
    private readonly addressRepository: Repository<SavedAddress>,
    private readonly dataSource: DataSource,
  ) {}

  /// Default first, then oldest first — the order the list screen renders.
  async list(userId: string) {
    const addresses = await this.addressRepository.find({
      where: { user_id: userId },
      order: { is_default: 'DESC', created_at: 'ASC' },
    });

    return addresses.map((address) => this.toResponse(address));
  }

  async create(userId: string, dto: CreateAddressDto) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SavedAddress);

      // The first address is always the default, whatever the client asked for.
      const existing = await repo.count({ where: { user_id: userId } });
      const isDefault = dto.is_default === true || existing === 0;

      if (isDefault) {
        await repo.update({ user_id: userId }, { is_default: false });
      }

      return repo.save(
        repo.create({
          user_id: userId,
          type: dto.type,
          label: dto.label,
          full_address: dto.full_address,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          is_default: isDefault,
        }),
      );
    });

    return this.toResponse(saved);
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SavedAddress);
      const address = await this.findOrFail(userId, id, repo);

      if (dto.type !== undefined) address.type = dto.type;
      if (dto.label !== undefined) address.label = dto.label;
      if (dto.full_address !== undefined) {
        address.full_address = dto.full_address;
      }
      if (dto.latitude !== undefined) address.latitude = dto.latitude;
      if (dto.longitude !== undefined) address.longitude = dto.longitude;

      if (dto.is_default === true) {
        await repo.update(
          { user_id: userId, id: Not(id) },
          { is_default: false },
        );
        address.is_default = true;
      } else if (dto.is_default === false && address.is_default) {
        // Un-ticking "default" on the current default has to hand the flag to
        // someone else, not just drop it. Clearing it outright would leave an
        // account with addresses and none selected — a state the Home/Work
        // shortcuts and the ride prefill have no way to represent.
        const successor = await repo.findOne({
          where: { user_id: userId, id: Not(id) },
          order: { created_at: 'ASC' },
        });

        if (successor) {
          successor.is_default = true;
          await repo.save(successor);
          address.is_default = false;
        }
        // No successor: this is the only address, so it stays the default.
      }

      return repo.save(address);
    });

    return this.toResponse(saved);
  }

  async remove(userId: string, id: string) {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SavedAddress);
      const address = await this.findOrFail(userId, id, repo);

      await repo.delete({ id: address.id });

      // Deleting the default promotes the oldest survivor rather than leaving
      // the account with no default at all.
      if (address.is_default) {
        const next = await repo.findOne({
          where: { user_id: userId },
          order: { created_at: 'ASC' },
        });
        if (next) {
          next.is_default = true;
          await repo.save(next);
        }
      }
    });

    return { id, deleted: true };
  }

  async setDefault(userId: string, id: string) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SavedAddress);
      const address = await this.findOrFail(userId, id, repo);

      await repo.update({ user_id: userId, id: Not(id) }, { is_default: false });
      address.is_default = true;
      return repo.save(address);
    });

    return this.toResponse(saved);
  }

  /// Scoped by `user_id` as well as `id`, so a guessed uuid from another
  /// account reads as "not found" rather than exposing or editing it.
  private async findOrFail(
    userId: string,
    id: string,
    repo: Repository<SavedAddress>,
  ): Promise<SavedAddress> {
    const address = await repo.findOne({ where: { id, user_id: userId } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  private toResponse(address: SavedAddress) {
    return {
      id: address.id,
      type: address.type,
      label: address.label,
      full_address: address.full_address,
      latitude: address.latitude,
      longitude: address.longitude,
      is_default: address.is_default,
    };
  }
}
