import { registerAs } from '@nestjs/config';

export default registerAs('razorpay', () => ({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
  webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
}));
