import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MacrosService } from './macros.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class MacrosController {
  constructor(private readonly macrosService: MacrosService) {}

  // Agent routes
  @Get('macros')
  getActiveMacros() {
    return this.macrosService.findAllActive();
  }

  @Post('tickets/:ticketId/macros/:macroId/apply')
  applyMacro(
    @Param('ticketId') ticketId: string,
    @Param('macroId') macroId: string,
    @Request() req: any
  ) {
    return this.macrosService.applyMacro(+ticketId, +macroId, req.user.id);
  }

  // Admin routes

  @Roles('admin')
  @Get('admin/macros')
  getAllMacros() {
    return this.macrosService.findAll();
  }


  @Roles('admin')
  @Post('admin/macros')
  createMacro(@Body() data: any) {
    return this.macrosService.create(data);
  }


  @Roles('admin')
  @Put('admin/macros/:id')
  updateMacro(@Param('id') id: string, @Body() data: any) {
    return this.macrosService.update(+id, data);
  }


  @Roles('admin')
  @Delete('admin/macros/:id')
  deleteMacro(@Param('id') id: string) {
    return this.macrosService.remove(+id);
  }
}
