import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OverviewsService } from './overviews.service';
import { Overview } from './entities/overview.entity';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('overviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OverviewsController {
  constructor(private readonly overviewsService: OverviewsService) {}

  @Get('available')
  @Roles('admin', 'agent', 'customer')
  available(@Req() req: any) {
    return this.overviewsService.findAvailable(req.user?.roles || []);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.overviewsService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'agent')
  findOne(@Param('id') id: string) {
    return this.overviewsService.findById(+id);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: Partial<Overview>) {
    return this.overviewsService.create(data);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: Partial<Overview>) {
    return this.overviewsService.update(+id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.overviewsService.remove(+id);
  }
}
