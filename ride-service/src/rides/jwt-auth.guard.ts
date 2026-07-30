import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Verifies the bearer token, exactly as every other service does.
 *
 * This used to hand-decode the JWT payload without ever checking the signature
 * and — worse — fall back to a hardcoded user whenever the header was missing
 * or unparseable, always returning true. A caller with no token at all was
 * silently treated as a signed-in passenger, so anyone could request, read and
 * cancel anybody's rides. None of that behaviour was worth keeping.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
