# Niklo — Profile Module Remaining Backend Action Items

> **Target Services**: `user-service` (Port `3002`), `payment-service` (Port `3007`)

---

## Remaining Action Items for Backend Developer

| # | Task | Service / File | Priority | Action Needed |
|---|---|---|---|---|
| 1 | **Real SMS Dispatch for Emergency SOS** | `user-service` (`users.service.ts`) | **Medium** | Integrate SMS provider (Twilio / Fast2SMS / AWS SNS) in `triggerEmergencySos()` to send actual SMS to `user_emergency_contacts.phone_number`. |
| 2 | **Wallet Balance Sync Event** | `payment-service` & `user-service` | **Low** | Emit event / webhook sync from `payment-service` to update `users.wallet_balance` in `user-service` when ledger transactions are processed. |

---

## 1. Emergency SOS — 3rd-Party SMS Gateway Integration

### Problem
`triggerEmergencySos()` in `users.service.ts` fetches contacts and logs coordinates, but physical SMS messages are not yet dispatched through a cellular SMS gateway provider.

### Required Implementation (`users.service.ts`)
```typescript
async triggerEmergencySos(userId: string, sosData: any) {
  const contacts = await this.emergencyContactRepository.find({ where: { user_id: userId } });

  const mapsUrl = (sosData.latitude && sosData.longitude)
    ? `https://maps.google.com/?q=${sosData.latitude},${sosData.longitude}`
    : '';

  // TODO: Dispatch real SMS via Twilio / Fast2SMS / AWS SNS to each contact.phone_number
  for (const contact of contacts) {
    if (contact.phone_number) {
      // await this.smsService.send({
      //   to: contact.phone_number,
      //   message: `EMERGENCY ALERT: User triggered SOS! Location: ${mapsUrl}`,
      // });
    }
  }

  this.logger.warn(`SOS dispatched for user ${userId} to ${contacts.length} contacts.`);

  return {
    sos_id: `sos_${Date.now()}`,
    alerts_sent: contacts.length,
    police_notified: false,
    message: `Emergency SOS dispatched to ${contacts.length} contacts.`,
  };
}
```

---

## 2. Wallet Balance Event Synchronization

### Goal
When `payment-service` processes top-ups via Razorpay webhook or deducts money for bookings, sync the updated balance to `users.wallet_balance` in `user-service` (or publish a RabbitMQ/Redis event).
