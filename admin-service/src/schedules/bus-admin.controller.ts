import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { BusAdminService } from './bus-admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Permissions } from '../auth/roles.guard';

@Controller('api/v1/bus')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BusAdminController {
  constructor(private readonly busAdminService: BusAdminService) {}

  // ==================== BUSES ====================

  @Get('buses')
  @Permissions('read:schedules')
  async getBuses(@Query('operator_id') operatorId?: string) {
    return this.busAdminService.getBuses(operatorId);
  }

  @Post('buses')
  @Permissions('write:schedules')
  async createBus(@Body() body: any, @Headers('authorization') auth?: string) {
    return this.busAdminService.createBus(body, { Authorization: auth });
  }

  @Get('buses/:id')
  @Permissions('read:schedules')
  async getBusById(@Param('id') id: string) {
    return this.busAdminService.getBusById(id);
  }

  @Patch('buses/:id')
  @Permissions('write:schedules')
  async updateBus(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.updateBus(id, body, { Authorization: auth });
  }

  @Post('buses/:id/seats')
  @Permissions('write:schedules')
  async bulkCreateSeats(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.bulkCreateSeats(id, body, { Authorization: auth });
  }

  @Get('buses/:id/seats')
  @Permissions('read:schedules')
  async getBusSeats(@Param('id') id: string) {
    return this.busAdminService.getBusSeats(id);
  }

  // ==================== LOCATIONS ====================

  @Get('locations/autocomplete')
  @Permissions('read:schedules')
  async getLocationsAutocomplete(@Query('query') query: string) {
    return this.busAdminService.getLocationsAutocomplete(query);
  }

  // ==================== OPERATORS ====================

  @Get('operators')
  @Permissions('read:schedules')
  async getOperators() {
    return this.busAdminService.getOperators();
  }

  @Post('operators')
  @Permissions('write:schedules')
  async createOperator(@Body() body: any, @Headers('authorization') auth?: string) {
    return this.busAdminService.createOperator(body, { Authorization: auth });
  }

  @Get('operators/:id')
  @Permissions('read:schedules')
  async getOperatorById(@Param('id') id: string) {
    return this.busAdminService.getOperatorById(id);
  }

  @Get('operators/:id/summary')
  @Permissions('read:schedules')
  async getOperatorSummary(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.getOperatorSummary(id, { Authorization: auth });
  }

  @Patch('operators/:id')
  @Permissions('write:schedules')
  async updateOperator(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.updateOperator(id, body, { Authorization: auth });
  }

  @Delete('operators/:id')
  @Permissions('write:schedules')
  async deleteOperator(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.deleteOperator(id, { Authorization: auth });
  }

  // ==================== POPULAR ROUTES ====================

  @Get('popular-routes')
  @Permissions('read:schedules')
  async getPopularRoutes() {
    return this.busAdminService.getPopularRoutes();
  }

  @Post('popular-routes')
  @Permissions('write:schedules')
  async createPopularRoute(@Body() body: any) {
    return this.busAdminService.createPopularRoute(body);
  }

  // ==================== ROUTES ====================

  @Get('routes/search')
  @Permissions('read:schedules')
  async searchRoutes(
    @Query('source') source: string,
    @Query('destination') destination: string,
  ) {
    return this.busAdminService.searchRoutes(source, destination);
  }

  @Get('routes')
  @Permissions('read:schedules')
  async getRoutes() {
    return this.busAdminService.getRoutes();
  }

  @Post('routes')
  @Permissions('write:schedules')
  async createRoute(@Body() body: any, @Headers('authorization') auth?: string) {
    return this.busAdminService.createRoute(body, { Authorization: auth });
  }

  @Get('routes/:id')
  @Permissions('read:schedules')
  async getRouteById(@Param('id') id: string) {
    return this.busAdminService.getRouteById(id);
  }

  @Patch('routes/:id')
  @Permissions('write:schedules')
  async updateRoute(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.updateRoute(id, body, { Authorization: auth });
  }

  @Delete('routes/:id')
  @Permissions('write:schedules')
  async deleteRoute(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.deleteRoute(id, { Authorization: auth });
  }

  // ==================== SCHEDULES ====================

  @Get('schedules/search')
  @Permissions('read:schedules')
  async searchSchedules(
    @Query('source') source: string,
    @Query('destination') destination: string,
    @Query('date') date: string,
  ) {
    return this.busAdminService.searchSchedules(source, destination, date);
  }

  @Get('schedules')
  @Permissions('read:schedules')
  async getSchedules(
    @Query('operator_id') operatorId?: string,
    @Query('route_id') routeId?: string,
    @Query('date') date?: string,
  ) {
    return this.busAdminService.getSchedules(routeId, date, operatorId);
  }

  @Post('schedules')
  @Permissions('write:schedules')
  async createSchedule(@Body() body: any, @Headers('authorization') auth?: string) {
    return this.busAdminService.createSchedule(body, { Authorization: auth });
  }

  @Get('schedules/:id')
  @Permissions('read:schedules')
  async getScheduleById(@Param('id') id: string) {
    return this.busAdminService.getScheduleById(id);
  }

  @Get('schedules/:id/seat-map')
  @Permissions('read:schedules')
  async getScheduleSeatMap(@Param('id') id: string) {
    return this.busAdminService.getScheduleSeatMap(id);
  }

  @Post('schedules/:id/lock-seat')
  @Permissions('write:schedules')
  async lockSeat(
    @Param('id') id: string,
    @Body() body: { seat_numbers: string[]; user_id: string },
  ) {
    return this.busAdminService.lockSeat(id, body);
  }

  @Post('schedules/:id/confirm-seats')
  @Permissions('write:schedules')
  async confirmSeats(
    @Param('id') id: string,
    @Body() body: { seat_numbers: string[] },
  ) {
    return this.busAdminService.confirmSeats(id, body);
  }

  @Get('schedules/:id/boarding-points')
  @Permissions('read:schedules')
  async getScheduleBoardingPoints(@Param('id') id: string) {
    return this.busAdminService.getScheduleBoardingPoints(id);
  }

  @Get('schedules/:id/manifest')
  @Permissions('read:schedules')
  async getScheduleManifest(@Param('id') id: string) {
    return this.busAdminService.getScheduleManifest(id);
  }

  @Patch('schedules/:id')
  @Permissions('write:schedules')
  async updateSchedule(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.updateSchedule(id, body, { Authorization: auth });
  }

  @Delete('schedules/:id')
  @Permissions('write:schedules')
  async deleteSchedule(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.deleteSchedule(id, { Authorization: auth });
  }

  // ==================== DRIVERS ====================

  @Get('drivers')
  @Permissions('read:schedules')
  async getDrivers(
    @Query('operator_id') operatorId?: string,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.getDrivers(operatorId, { Authorization: auth });
  }

  @Post('drivers')
  @Permissions('write:schedules')
  async createDriver(@Body() body: any, @Headers('authorization') auth?: string) {
    return this.busAdminService.createDriver(body, { Authorization: auth });
  }

  @Get('drivers/:id')
  @Permissions('read:schedules')
  async getDriverById(@Param('id') id: string, @Headers('authorization') auth?: string) {
    return this.busAdminService.getDriverById(id, { Authorization: auth });
  }

  @Patch('drivers/:id')
  @Permissions('write:schedules')
  async updateDriver(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth?: string,
  ) {
    return this.busAdminService.updateDriver(id, body, { Authorization: auth });
  }

  @Delete('drivers/:id')
  @Permissions('write:schedules')
  async deleteDriver(@Param('id') id: string, @Headers('authorization') auth?: string) {
    return this.busAdminService.deleteDriver(id, { Authorization: auth });
  }
}
