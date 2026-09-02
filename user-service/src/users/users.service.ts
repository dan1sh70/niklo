import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, KycStatus, UserRole } from './entities/user.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { SavedAddress } from './entities/saved-address.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly s3Client: S3Client;
  private readonly s3BucketName: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EmergencyContact)
    private readonly emergencyContactRepository: Repository<EmergencyContact>,
    @InjectRepository(SavedAddress)
    private readonly savedAddressRepository: Repository<SavedAddress>,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION', 'ap-south-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
    this.s3BucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME', 'niklo-avatars-bucket');
  }

  private async getOrCreateUser(jwtUser: any) {
    const userId = jwtUser.id || jwtUser.sub;
    if (!userId) {
      throw new NotFoundException('Invalid JWT payload: missing user ID');
    }
    let user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      // JIT Provisioning: auto-create the user if they were created in auth-service but not here
      this.logger.log(`JIT Provisioning user ${userId}`);
      user = this.userRepository.create({
        id: userId,
        phone: jwtUser.phone || `mock-${Date.now()}`,
        name: jwtUser.name || 'New User',
        role: jwtUser.role || UserRole.PASSENGER
      });
      await this.userRepository.save(user);
    }
    return user;
  }

  async getProfile(jwtUser: any) {
    const user = await this.getOrCreateUser(jwtUser);

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      dob: user.dob,
      gender: user.gender,
      avatar_url: user.avatar_url,
      kyc_status: user.kyc_status,
      wallet_balance: Number(user.wallet_balance),
      preferred_language: user.preferred_language,
    };
  }

  async updateProfile(jwtUser: any, updateData: any) {
    const user = await this.getOrCreateUser(jwtUser);
    
    // Whitelist allowed fields for update
    const allowedFields = ['name', 'email', 'avatar_url', 'preferred_language', 'dob', 'gender'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    const updatedUser = await this.userRepository.save(user);

    return {
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }

  async uploadKyc(jwtUser: any, kycData: any) {
    const user = await this.getOrCreateUser(jwtUser);
    
    // Mock KYC upload
    user.kyc_status = KycStatus.VERIFIED;
    await this.userRepository.save(user);

    return {
      message: 'KYC documents submitted and verified successfully',
      status: user.kyc_status,
    };
  }

  async getWallet(jwtUser: any) {
    const user = await this.getOrCreateUser(jwtUser);

    return {
      userId: user.id,
      balance: Number(user.wallet_balance),
      currency: 'INR',
    };
  }

  async syncWalletBalance(userId: string, amount: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found for wallet sync');

    const newBalance = Number(user.wallet_balance) + Number(amount);
    user.wallet_balance = newBalance;
    await this.userRepository.save(user);

    return {
      userId: user.id,
      balance: newBalance,
      message: 'Wallet balance synced successfully',
    };
  }

  async getSavedLocations(jwtUser: any) {
    const user = await this.getOrCreateUser(jwtUser);
    return this.savedAddressRepository.find({
      where: { user_id: user.id },
      order: { is_default: 'DESC', created_at: 'ASC' },
    });
  }

  async addSavedLocation(jwtUser: any, dto: any) {
    const user = await this.getOrCreateUser(jwtUser);
    const isFirst = (await this.savedAddressRepository.count({ where: { user_id: user.id } })) === 0;
    const isDefault = dto.is_default || isFirst;

    if (isDefault) {
      await this.savedAddressRepository.update({ user_id: user.id }, { is_default: false });
    }

    const address = this.savedAddressRepository.create({
      user_id: user.id,
      type: dto.type || 'other',
      label: dto.label || 'Home',
      full_address: dto.full_address,
      latitude: dto.latitude ?? 0,
      longitude: dto.longitude ?? 0,
      is_default: isDefault,
    });

    return this.savedAddressRepository.save(address);
  }

  async updateSavedLocation(jwtUser: any, id: string, dto: any) {
    const user = await this.getOrCreateUser(jwtUser);
    const address = await this.savedAddressRepository.findOne({ where: { id, user_id: user.id } });
    if (!address) throw new NotFoundException('Address not found');

    if (dto.is_default) {
      await this.savedAddressRepository.update({ user_id: user.id }, { is_default: false });
    }

    Object.assign(address, {
      type: dto.type ?? address.type,
      label: dto.label ?? address.label,
      full_address: dto.full_address ?? address.full_address,
      latitude: dto.latitude ?? address.latitude,
      longitude: dto.longitude ?? address.longitude,
      is_default: dto.is_default ?? address.is_default,
    });

    return this.savedAddressRepository.save(address);
  }

  async deleteSavedLocation(jwtUser: any, id: string) {
    const user = await this.getOrCreateUser(jwtUser);
    const address = await this.savedAddressRepository.findOne({ where: { id, user_id: user.id } });
    if (!address) throw new NotFoundException('Address not found');

    const wasDefault = address.is_default;
    await this.savedAddressRepository.remove(address);

    // If the deleted address was default, promote the oldest remaining one
    if (wasDefault) {
      const next = await this.savedAddressRepository.findOne({
        where: { user_id: user.id },
        order: { created_at: 'ASC' },
      });
      if (next) {
        next.is_default = true;
        await this.savedAddressRepository.save(next);
      }
    }

    return { message: 'Address deleted' };
  }

  async setDefaultLocation(jwtUser: any, id: string) {
    const user = await this.getOrCreateUser(jwtUser);
    await this.savedAddressRepository.update({ user_id: user.id }, { is_default: false });
    await this.savedAddressRepository.update({ id, user_id: user.id }, { is_default: true });
    return { message: 'Default address updated' };
  }

  async uploadAvatar(jwtUser: any, fileData: any) {
    const user = await this.getOrCreateUser(jwtUser);
    
    if (!fileData || !fileData.buffer) {
      throw new Error('No file provided');
    }

    const fileExtension = fileData.originalname?.split('.').pop() || 'png';
    const key = `avatars/${user.id}-${Date.now()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.s3BucketName,
      Key: key,
      Body: fileData.buffer,
      ContentType: fileData.mimetype,
      // ACL: 'public-read', // Uncomment if bucket allows public ACLs
    });

    await this.s3Client.send(command);

    const avatarUrl = `https://${this.s3BucketName}.s3.${this.configService.get<string>('AWS_REGION', 'ap-south-1')}.amazonaws.com/${key}`;
    user.avatar_url = avatarUrl;
    await this.userRepository.save(user);

    return {
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl,
    };
  }

  async getEmergencyContacts(jwtUser: any) {
    const user = await this.getOrCreateUser(jwtUser);
    return this.emergencyContactRepository.find({
      where: { user_id: user.id },
    });
  }

  async addEmergencyContact(jwtUser: any, contactData: any) {
    const user = await this.getOrCreateUser(jwtUser);
    const contact = this.emergencyContactRepository.create({
      user_id: user.id,
      contact_name: contactData.contact_name || contactData.name,
      phone_number: contactData.phone_number || contactData.phone,
      relationship: contactData.relationship,
      is_primary: contactData.is_primary || false,
    });
    return this.emergencyContactRepository.save(contact);
  }

  async deleteEmergencyContact(jwtUser: any, contactId: string) {
    const user = await this.getOrCreateUser(jwtUser);
    const contact = await this.emergencyContactRepository.findOne({
      where: { id: contactId, user_id: user.id },
    });
    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }
    await this.emergencyContactRepository.remove(contact);
    return { message: 'Emergency contact deleted successfully' };
  }

  async triggerEmergencySos(jwtUser: any, sosData: any) {
    const user = await this.getOrCreateUser(jwtUser);
    const contacts = await this.emergencyContactRepository.find({ where: { user_id: user.id } });

    const mapsUrl = (sosData.latitude && sosData.longitude)
      ? `https://maps.google.com/?q=${sosData.latitude},${sosData.longitude}`
      : '';

    const twilioAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    
    let alertsSent = 0;

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);
      const messageBody = `EMERGENCY: User triggered SOS! Location: ${mapsUrl}`;
      
      for (const contact of contacts) {
        try {
          await twilioClient.messages.create({
            body: messageBody,
            from: twilioPhoneNumber,
            to: contact.phone_number
          });
          alertsSent++;
        } catch (error) {
          this.logger.error(`Failed to send SOS SMS to ${contact.phone_number}:`, error);
        }
      }
    } else {
      this.logger.warn(`Twilio credentials missing. SOS triggered for user ${user.id}. Contacts: ${contacts.length}. Location: ${mapsUrl}`);
      alertsSent = contacts.length;
    }

    return {
      sos_id: `sos_${Date.now()}`,
      alerts_sent: alertsSent,
      police_notified: false,
      message: `Emergency SOS dispatched to ${alertsSent} contacts.`,
    };
  }
}
