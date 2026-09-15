import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { VendorSubscription } from './entities/vendor-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, VendorSubscription])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
