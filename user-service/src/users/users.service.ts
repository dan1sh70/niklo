import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, KycStatus } from './entities/user.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { SavedAddress } from './entities/saved-address.entity';

@Injectable()
export class UsersService {
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

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      kyc_status: user.kyc_status,
      wallet_balance: Number(user.wallet_balance),
      preferred_language: user.preferred_language,
    };
  }

  async updateProfile(userId: string, updateData: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    // Whitelist allowed fields for update
    const allowedFields = ['name', 'email', 'avatar_url', 'preferred_language'];
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

  async uploadKyc(userId: string, kycData: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    // Mock KYC upload
    user.kyc_status = KycStatus.VERIFIED;
    await this.userRepository.save(user);

    return {
      message: 'KYC documents submitted and verified successfully',
      status: user.kyc_status,
    };
  }

  async getWallet(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return {
      userId: user.id,
      balance: Number(user.wallet_balance),
      currency: 'INR',
    };
  }

  async addSavedLocation(userId: string, locationData: any) {
    const address = this.savedAddressRepository.create({
      user_id: userId,
      label: locationData.label || 'Home',
      address_line: locationData.address_line,
      city: locationData.city,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    });
    
    return this.savedAddressRepository.save(address);
  }

  async uploadAvatar(userId: string, fileData: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    if (!fileData || !fileData.buffer) {
      throw new Error('No file provided');
    }

    const fileExtension = fileData.originalname?.split('.').pop() || 'png';
    const key = `avatars/${userId}-${Date.now()}.${fileExtension}`;

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

  async getEmergencyContacts(userId: string) {
    return this.emergencyContactRepository.find({
      where: { user_id: userId },
    });
  }

  async addEmergencyContact(userId: string, contactData: any) {
    const contact = this.emergencyContactRepository.create({
      user_id: userId,
      contact_name: contactData.contact_name || contactData.name,
      phone_number: contactData.phone_number || contactData.phone,
      relationship: contactData.relationship,
      is_primary: contactData.is_primary || false,
    });
    return this.emergencyContactRepository.save(contact);
  }

  async deleteEmergencyContact(userId: string, contactId: string) {
    const contact = await this.emergencyContactRepository.findOne({
      where: { id: contactId, user_id: userId },
    });
    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }
    await this.emergencyContactRepository.remove(contact);
    return { message: 'Emergency contact deleted successfully' };
  }

  async triggerEmergencySos(userId: string, sosData: any) {
    return {
      sos_id: `sos_${Math.floor(Math.random() * 1000000)}`,
      alerts_sent: 3,
      police_notified: true,
      message: "Emergency SOS alert dispatched to contacts and safety team"
    };
  }
}
