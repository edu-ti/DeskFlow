import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PostmasterFiltersService } from './postmaster-filters.service';
import { CreatePostmasterFilterDto, UpdatePostmasterFilterDto } from './dto/postmaster-filter.dto';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('postmaster-filters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostmasterFiltersController {
  constructor(private readonly filterService: PostmasterFiltersService) {}

  @Get()
  @Roles('admin', 'agent')
  findAll() {
    return this.filterService.findAll();
  }

  @Post()
  @Roles('admin')
  create(@Body() data: CreatePostmasterFilterDto) {
    return this.filterService.create(data);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: UpdatePostmasterFilterDto) {
    return this.filterService.update(+id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.filterService.remove(+id);
  }
}
