import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { FieldServiceService } from './field-service.service';
import { CreateFieldActivityDto, UpdateFieldActivityDto, CheckInDto, CheckOutDto } from './dto/field-activity.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../iam/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('field-service')
export class FieldServiceController {
  constructor(private readonly fieldService: FieldServiceService) {}

  @Get('activities')
  async findAll(
    @Query('technician_id') techId?: string,
    @Query('organization_id') orgId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.fieldService.findAll({
      technician_id: techId ? parseInt(techId) : undefined,
      organization_id: orgId ? parseInt(orgId) : undefined,
      status,
      from,
      to,
    });
  }

  @Get('activities/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fieldService.findOne(id);
  }

  @Post('activities')
  async create(@Body() dto: CreateFieldActivityDto, @Request() req: AuthenticatedRequest) {
    return this.fieldService.create(dto, req.user?.id || 1);
  }

  @Put('activities/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFieldActivityDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.fieldService.update(id, dto, req.user?.id || 1);
  }

  @Patch('activities/:id/check-in')
  async checkIn(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckInDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.fieldService.checkIn(id, dto, req.user?.id || 1);
  }

  @Patch('activities/:id/check-out')
  async checkOut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckOutDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.fieldService.checkOut(id, dto, req.user?.id || 1);
  }

  @Delete('activities/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.fieldService.remove(id);
  }
}
