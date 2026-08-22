import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { RmmService } from './rmm.service';
import { IngestHeartbeatDto, CreateDeviceDto } from './dto/rmm.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';

@Controller('rmm')
export class RmmController {
  constructor(private readonly rmmService: RmmService) {}

  /**
   * Endpoint público / autenticado para os agentes RMM enviarem telemetria a cada 60s
   */
  @Post('heartbeat')
  async heartbeat(@Body() dto: IngestHeartbeatDto) {
    return this.rmmService.ingestHeartbeat(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('devices')
  async findAllDevices(
    @Query('organization_id') orgId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.rmmService.findAllDevices({
      organization_id: orgId ? parseInt(orgId) : undefined,
      status,
      search,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('devices/:id')
  async findDeviceById(@Param('id', ParseIntPipe) id: number) {
    return this.rmmService.findDeviceById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('devices')
  async createDevice(@Body() dto: CreateDeviceDto) {
    return this.rmmService.createDevice(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('devices/:id')
  async updateDevice(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.rmmService.updateDevice(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('devices/:id')
  async removeDevice(@Param('id', ParseIntPipe) id: number) {
    return this.rmmService.removeDevice(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('alerts')
  async findAllAlerts(
    @Query('device_id') deviceId?: string,
    @Query('is_resolved') isResolved?: string,
  ) {
    return this.rmmService.findAllAlerts({
      device_id: deviceId ? parseInt(deviceId) : undefined,
      is_resolved: isResolved !== undefined ? isResolved === 'true' : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('alerts/:id/resolve')
  async resolveAlert(@Param('id', ParseIntPipe) id: number) {
    return this.rmmService.resolveAlert(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('agent-script')
  getAgentScript(@Query('organization_id') orgId?: string, @Req() req?: any) {
    const host = req?.headers?.host || 'localhost:3000';
    const protocol = req?.protocol || 'http';
    const serverUrl = `${protocol}://${host}`;
    const script = this.rmmService.generatePowerShellAgentScript(serverUrl, orgId ? parseInt(orgId) : undefined);
    return { script, serverUrl };
  }
}
