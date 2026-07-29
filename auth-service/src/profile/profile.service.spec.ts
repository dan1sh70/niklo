import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { User, KycStatus } from '../users/entities/user.entity';

const existingUser = (): User =>
  ({
    id: 'user-1',
    phone: '+919876543210',
    email: 'faizan@example.com',
    name: 'Faizan',
    dob: '12 March 1995',
    gender: 'Male',
    avatar_url: null,
    kyc_status: KycStatus.PENDING,
    // pg returns `numeric` as a string, which is exactly what makes the
    // wallet_balance assertion below worth having.
    wallet_balance: '1500.50' as unknown as number,
    preferred_language: 'en',
    created_at: new Date('2026-01-01T00:00:00Z'),
    is_active: true,
  }) as User;

describe('ProfileService', () => {
  let service: ProfileService;
  let repo: { findOne: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn().mockResolvedValue(existingUser()),
      save: jest.fn().mockImplementation((user: User) => Promise.resolve(user)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  describe('getProfile', () => {
    it('returns wallet_balance as a number', async () => {
      // The client calls .toDouble() on this, which throws on a String.
      const profile = await service.getProfile('user-1');

      expect(profile.wallet_balance).toBe(1500.5);
      expect(typeof profile.wallet_balance).toBe('number');
    });

    it('returns the snake_case keys the client parses', async () => {
      const profile = await service.getProfile('user-1');

      expect(Object.keys(profile).sort()).toEqual(
        [
          'avatar_url',
          'dob',
          'email',
          'gender',
          'id',
          'kyc_status',
          'name',
          'phone',
          'preferred_language',
          'wallet_balance',
        ].sort(),
      );
    });

    it('404s on an id that is not in the table', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.getProfile('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('leaves fields the caller did not send alone', async () => {
      const profile = await service.updateProfile('user-1', { name: 'Faizan K' });

      expect(profile.name).toBe('Faizan K');
      expect(profile.email).toBe('faizan@example.com');
      expect(profile.dob).toBe('12 March 1995');
      expect(profile.gender).toBe('Male');
    });

    it('writes every field that was sent', async () => {
      const profile = await service.updateProfile('user-1', {
        name: 'Faizan K',
        email: 'new@example.com',
        dob: '1 January 1996',
        gender: 'Female',
      });

      expect(profile).toMatchObject({
        name: 'Faizan K',
        email: 'new@example.com',
        dob: '1 January 1996',
        gender: 'Female',
      });
    });

    it('stores a cleared field as NULL, not an empty string', async () => {
      // Two users holding '' would collide on the unique email constraint.
      const profile = await service.updateProfile('user-1', { email: '' });

      expect(profile.email).toBeNull();
    });

    it('reports a taken email as a conflict rather than a 500', async () => {
      repo.save.mockRejectedValue({ driverError: { code: '23505' } });

      await expect(
        service.updateProfile('user-1', { email: 'taken@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('does not swallow unrelated database failures', async () => {
      const boom = new Error('connection terminated');
      repo.save.mockRejectedValue(boom);

      await expect(
        service.updateProfile('user-1', { name: 'Faizan K' }),
      ).rejects.toBe(boom);
    });

    it('404s on an id that is not in the table', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('ghost', { name: 'Nobody' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
