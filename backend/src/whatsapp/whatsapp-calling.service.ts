import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from '../settings/services/settings.service';
import { UpdateCallSettingsDto } from './dto/update-call-settings.dto';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

interface CallingConfig {
  token: string;
  phoneId: string;
}

@Injectable()
export class WhatsappCallingService {
  private readonly logger = new Logger(WhatsappCallingService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
  ) {}

  private async getConfig(): Promise<CallingConfig> {
    const token = await this.settingsService.getSetting('whatsapp_token');
    const phoneId = await this.settingsService.getSetting('whatsapp_phone_id');
    if (!token || !phoneId) {
      throw new BadRequestException(
        'WhatsApp não configurado para chamadas: defina whatsapp_token e whatsapp_phone_id nas configurações.',
      );
    }
    return { token, phoneId };
  }

  private isEligibleTier(tier?: string): boolean {
    if (!tier) return false;
    if (tier === 'TIER_1K') return false;
    // TIER_10K+ possuem limite ≥ 2000, requisito para chamadas iniciadas pela empresa
    return /^TIER_(10K|50K|100K|250K|UNLIMITED)$/.test(tier);
  }

  async getCallingEligibility() {
    const { token, phoneId } = await this.getConfig();
    const url = `${GRAPH_API_BASE}/${phoneId}?fields=messaging_limit_tier,quality_rating,throughput,display_phone_number,verified_name`;
    const resp = await firstValueFrom(
      this.httpService.get(url, { headers: { Authorization: `Bearer ${token}` } }),
    );
    const tier = resp.data.messaging_limit_tier as string | undefined;
    const eligible = this.isEligibleTier(tier);

    return {
      eligible,
      messaging_limit_tier: tier || 'UNKNOWN',
      quality_rating: resp.data.quality_rating || null,
      throughput: resp.data.throughput ?? null,
      display_phone_number: resp.data.display_phone_number || null,
      verified_name: resp.data.verified_name || null,
      message: eligible
        ? 'Elegível para chamadas de saída (limite de mensagens ≥ 2000).'
        : 'Limite de mensagens abaixo de 2000: apenas chamadas de entrada e pedidos de retorno estarão disponíveis.',
    };
  }

  async getCallSettings() {
    const { token, phoneId } = await this.getConfig();
    const url = `${GRAPH_API_BASE}/${phoneId}/settings`;
    try {
      const resp = await firstValueFrom(
        this.httpService.get(url, { headers: { Authorization: `Bearer ${token}` } }),
      );
      const calling = resp.data?.calling || { status: 'DISABLED' };
      await this.saveLocal(calling);
      return { ...calling, source: 'meta' };
    } catch (error) {
      this.logger.error('Falha ao buscar call settings na Meta', error);
      return this.getLocalCallSettings();
    }
  }

  async updateCallSettings(dto: UpdateCallSettingsDto) {
    const { token, phoneId } = await this.getConfig();

    if (
      dto.call_hours?.status === 'ENABLED' &&
      (!dto.call_hours.timezone_id || !dto.call_hours.weekly_operating_hours?.length)
    ) {
      throw new BadRequestException(
        'call_hours com status ENABLED exige timezone_id e weekly_operating_hours.',
      );
    }

    const calling: Record<string, unknown> = {
      status: dto.status,
      ...(dto.call_icon_visibility ? { call_icon_visibility: dto.call_icon_visibility } : {}),
      ...(dto.callback_permission_status ? { callback_permission_status: dto.callback_permission_status } : {}),
      ...(dto.call_hours ? { call_hours: dto.call_hours } : {}),
    };

    const url = `${GRAPH_API_BASE}/${phoneId}/settings`;
    const resp = await firstValueFrom(
      this.httpService.post(url, { calling }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
    );

    await this.saveLocal(calling);
    this.logger.log(`Call settings atualizadas na Meta: status=${dto.status}`);
    return { success: true, calling, meta: resp.data };
  }

  private async saveLocal(calling: Record<string, unknown>) {
    await this.settingsService.updateSettings({
      calling_status: String(calling.status || 'DISABLED'),
      calling_call_icon_visibility: String(calling.call_icon_visibility || 'DEFAULT'),
      calling_callback_permission_status: String(calling.callback_permission_status || 'DISABLED'),
      calling_call_hours: calling.call_hours ? JSON.stringify(calling.call_hours) : '',
    });
  }

  private async getLocalCallSettings() {
    const [status, icon, callback, hours] = await Promise.all([
      this.settingsService.getSetting('calling_status', 'DISABLED'),
      this.settingsService.getSetting('calling_call_icon_visibility', 'DEFAULT'),
      this.settingsService.getSetting('calling_callback_permission_status', 'DISABLED'),
      this.settingsService.getSetting('calling_call_hours'),
    ]);
    return {
      status,
      call_icon_visibility: icon,
      callback_permission_status: callback,
      call_hours: hours ? JSON.parse(hours) : null,
      source: 'local',
    };
  }
}