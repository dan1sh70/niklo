import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PackagePartner } from '../setup/entities/package_partner.entity';
import { PackagePartnerDocument } from '../setup/entities/package_partner-document.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportTicketMessage } from './entities/support-ticket-message.entity';
import { FaqArticle } from './entities/faq-article.entity';
import { PackagePartnerBank } from '../setup/entities/package_partner-bank.entity';
import { PartnerDeviceFcmToken } from '../notifications/entities/partner-device-fcm-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PackagePartner,
      PackagePartnerDocument,
      SupportTicket,
      SupportTicketMessage,
      FaqArticle,
      PackagePartnerBank,
      PartnerDeviceFcmToken,
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
