import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

/// Profile reads and writes against the real `users` table.
///
/// These endpoints also exist on user-service, but that copy is a stub: it
/// returns a hardcoded "John Doe" and writes nothing, and its TypeORM
/// connection points at a separate `niklo_user` database whose `users` table
/// has no rows for real users. auth-service owns the rows — it is the only
/// place these can be served from correctly.
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    return this.toResponse(await this.findOrFail(userId));
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findOrFail(userId);

    // `undefined` means the client did not send the field; only what was sent
    // gets written.
    if (dto.name !== undefined) user.name = this.orNull(dto.name);
    if (dto.email !== undefined) user.email = this.orNull(dto.email);
    if (dto.dob !== undefined) user.dob = this.orNull(dto.dob);
    if (dto.gender !== undefined) user.gender = this.orNull(dto.gender);

    try {
      return this.toResponse(await this.userRepository.save(user));
    } catch (error) {
      // `email` is unique. Without this the caller gets an opaque 500 and no
      // idea that the address is simply taken.
      if (error?.driverError?.code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('That email is already in use');
      }
      throw error;
    }
  }

  private async findOrFail(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /// Blanks are stored as NULL, never as ''. `email` is unique, and two users
  /// holding '' would collide on that constraint.
  private orNull(value?: string): string | null {
    return value && value.length > 0 ? value : null;
  }

  private toResponse(user: User) {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      dob: user.dob,
      gender: user.gender,
      avatar_url: user.avatar_url,
      kyc_status: user.kyc_status,
      // `numeric` comes back from pg as a string. The client calls .toDouble()
      // on this value, which throws on a String.
      wallet_balance: Number(user.wallet_balance ?? 0),
      preferred_language: user.preferred_language,
    };
  }
}
