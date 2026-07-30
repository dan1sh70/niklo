import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

/// Per-user data keyed by a real `users` row, so it sits on auth-service beside
/// profile and wishlist.
///
/// JwtStrategy.validate returns `{ userId, phone }` — `req.user.userId`.
@Controller('api/v1/addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  list(@Request() req) {
    return this.addressesService.list(req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(req.user.userId, dto);
  }

  /// ParseUUIDPipe turns a malformed id into a 400 instead of letting Postgres
  /// reject the cast with a 500.
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(req.user.userId, id, dto);
  }

  @Post(':id/default')
  @HttpCode(HttpStatus.OK)
  setDefault(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressesService.setDefault(req.user.userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressesService.remove(req.user.userId, id);
  }
}
