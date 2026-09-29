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
  Query,
  Req,
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
  async create(@Body() dto: CreateOperatorDto) {
    return this.operatorsService.create(dto);
  }

  @Get()
  async findAll() {
    return this.operatorsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.operatorsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/summary')
  async getSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.operatorsService.getSummary(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOperatorDto) {
    return this.operatorsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.operatorsService.remove(id);
  }

  @Get(':id/reviews')
  async getReviews(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.operatorsService.getReviews(id, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    const userName = req.user?.name || 'Verified User'; // Ideally get from user profile service
    return this.operatorsService.createReview(id, dto, userName);
  }
}
