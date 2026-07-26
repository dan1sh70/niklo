import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Lets trusted services in with a shared key, everyone else with a JWT.
 *
 * Seat inventory is mutated by booking-service, sometimes on behalf of a signed
 * -in user (checkout) and sometimes with no user at all (the sweep that frees
 * seats from abandoned checkouts). The shared key covers the second case.
 *
 * `INTERNAL_API_KEY` must be set for the header path to work — an unset key
 * never matches, so a missing config degrades to JWT-only rather than to open
 * access.
 */
@Injectable()
export class InternalOrJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const presented = request.headers?.['x-internal-key'];
    const expected = process.env.INTERNAL_API_KEY;

    if (expected && presented && presented === expected) {
      return true;
    }

    return super.canActivate(context);
  }
}
