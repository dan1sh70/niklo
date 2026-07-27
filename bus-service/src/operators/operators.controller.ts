import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/bus/operators')
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() dto: CreateOperatorDto) {
    return this.operatorsService.create(dto, req.user?.id);
  }

  @Get()
  async findAll() {
    return this.operatorsService.findAll();
  }

  /**
   * The caller's own operator profile. Declared before `:id` so the literal
   * path wins over the UUID param route.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMine(@Request() req: any) {
    const operator = await this.operatorsService.findByUser(req.user.id);
    if (!operator) {
      throw new NotFoundException('No operator profile for this account');
    }
    return operator;
  }

  /** Ownership probe used by booking-service before releasing a manifest. */
  @UseGuards(JwtAuthGuard)
  @Get(':id/ownership')
  async checkOwnership(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return {
      operator_id: id,
      owned: await this.operatorsService.ownsOperator(req.user.id, id),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.operatorsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOperatorDto,
  ) {
    return this.operatorsService.update(id, dto, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.operatorsService.remove(id);
  }
}
