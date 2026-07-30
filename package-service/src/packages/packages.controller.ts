import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Delete,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Controller()
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  async create(@Body() createPackageDto: CreatePackageDto) {
    const data = await this.packagesService.create(createPackageDto);
    return { success: true, data };
  }

  @Get()
  async findAll() {
    const data = await this.packagesService.findAll();
    return { success: true, data };
  }

  // These two must stay ABOVE `@Get(':id')`. Nest matches in declaration order,
  // so a literal route declared after it is swallowed — `/packages/trending`
  // would be read as a package whose id is the string "trending" and fail in
  // Postgres as an invalid uuid instead of answering.

  @Get('trending')
  async findTrending(@Query('limit') limit?: string) {
    const data = await this.packagesService.findTrending(Number(limit));
    return { success: true, data };
  }

  @Get('categories')
  async findCategories() {
    const data = await this.packagesService.findCategories();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.packagesService.findOne(id);
    return { success: true, data };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePackageDto: UpdatePackageDto,
  ) {
    const data = await this.packagesService.update(id, updatePackageDto);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.packagesService.remove(id);
    return { success: true, data };
  }
}
