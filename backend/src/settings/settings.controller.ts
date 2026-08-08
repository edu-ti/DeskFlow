import { Controller, Get, Body, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './services/settings.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAll() {
    const settings = await this.settingsService.getAllSettings();
    return settings;
  }

  @Put()
  async updateBulk(@Body() settings: Record<string, string>) {
    await this.settingsService.updateSettings(settings);
    return { message: 'Configurações atualizadas com sucesso' };
  }
}
