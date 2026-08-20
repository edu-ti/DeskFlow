import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { SlaPoliciesService } from '../services/sla-policies.service';
import { SlaPolicy } from '../entities/sla-policy.entity';
import { CreateSlaPolicyDto, UpdateSlaPolicyDto } from '../dto/sla-policy.dto';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sla-policies')
export class SlaPoliciesController {
  constructor(private readonly slaPoliciesService: SlaPoliciesService) {}

  @Get()
  @Roles('admin')
  async findAll(): Promise<SlaPolicy[]> {
    return this.slaPoliciesService.findAll();
  }

  @Post()
  @Roles('admin')
  async create(@Body() data: CreateSlaPolicyDto): Promise<SlaPolicy> {
    return this.slaPoliciesService.create(data);
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSlaPolicyDto
  ): Promise<SlaPolicy> {
    return this.slaPoliciesService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    await this.slaPoliciesService.remove(id);
    return { success: true };
  }
}
