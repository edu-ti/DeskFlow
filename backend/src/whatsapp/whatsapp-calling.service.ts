import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from '../settings/services/settings.service';
import { CtiLog } from '../cti/entities/cti-log.entity';
import { WhatsappService } from './whatsapp.service';
import { NotificationsGateway } from '../notifications/gateway/notifications.gateway';
import { UpdateCallSettingsDto } from './dto/update-call-settings.dto';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { CallActionDto } from './dto/call-action.dto';
import { GRAPH_API_BASE } from '../common/graph-api.constants';

type CallAction = 'pre_accept' | 'accept' | 'reject' | 'terminate';

export interface CallState {
  callId: string;
  phoneId?: string;
  direction: 'USER_INITIATED' | 'BUSINESS_INITIATED';
  status: string;
  from: string;
  to: string;
  callerName?: string;
  sdp?: string;
  startedAt?: number;
}

@Injectable()
export class WhatsappCallingService {
  private readonly logger = new Logger(WhatsappCallingService.name);

  private activeCalls = new Map<string, CallState>();

  constructor(
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
    @InjectRepository(CtiLog)
    private readonly ctiLogRepository: Repository<CtiLog>,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private async getConfig(): Promise<{ token: string; phoneId: string }> {
    const token = await this.settingsService.getSetting('whatsapp_token');
    const phoneId = await this.settingsService.getSetting('whatsapp_phone_id');
    if (!token || !phoneId) {
      throw new BadRequestException(
        'WhatsApp não configurado para chamadas: defina whatsapp_token e whatsapp_phone_id nas configurações.',
      );
    }
    return { token, phoneId };
  }

  // ---------------------------------------------------------------------------
  // Configuração / elegibilidade (Fase 1)
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Ciclo de vida da chamada (Fase 2)
  // ---------------------------------------------------------------------------

  getActiveCalls(): CallState[] {
    return Array.from(this.activeCalls.values());
  }

  async handleCallWebhook(value: any): Promise<void> {
    try {
      const call = value?.calls?.[0];
      if (!call) return;

      const phoneId = value.metadata?.phone_number_id;
      const callerName = value.contacts?.[0]?.profile?.name;
      const { id: callId, event, direction, from, to, status, duration } = call;

      if (!callId) return;

      if (['connect', 'ringing', 'initiated'].includes(event)) {
        const sdp = call.session?.sdp;
        const state: CallState = {
          callId,
          phoneId,
          direction: direction || 'USER_INITIATED',
          status: 'ringing',
          from,
          to,
          callerName,
          sdp,
          startedAt: call.start_time ? Number(call.start_time) * 1000 : Date.now(),
        };
        this.activeCalls.set(callId, state);
        await this.saveLog(state);

        if (direction === 'BUSINESS_INITIATED') {
          this.notificationsGateway.sendCallEvent('call_state', { callId, status: 'connected', sdp });
        } else {
          this.notificationsGateway.sendCallEvent('call_incoming', {
            callId, from, to, callerName, phoneId, sdp,
          });
        }
        return;
      }

      if (event === 'terminate') {
        const prev = this.activeCalls.get(callId);
        const finalStatus = (Array.isArray(status) ? status.join(',') : status) || 'TERMINATED';
        const callDuration =
          duration ??
          (call.start_time && call.end_time
            ? Number(call.end_time) - Number(call.start_time)
            : undefined);
        const state: CallState = {
          callId,
          phoneId,
          direction: direction || prev?.direction || 'USER_INITIATED',
          status: finalStatus,
          from,
          to,
          callerName: prev?.callerName,
          sdp: prev?.sdp,
        };
        this.activeCalls.delete(callId);
        await this.finalizeLog(state, callDuration, finalStatus);
        this.notificationsGateway.sendCallEvent('call_terminated', {
          callId, from, to, status: finalStatus, duration: callDuration ?? null,
        });
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook de chamada', error);
    }
  }

  async initiateCall(dto: InitiateCallDto) {
    const { token, phoneId } = await this.getConfig();
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: dto.to,
      action: 'connect',
      session: { sdp_type: 'offer', sdp: dto.sdp },
    };
    if (dto.biz_opaque_callback_data) {
      body.biz_opaque_callback_data = dto.biz_opaque_callback_data;
    }
    const resp = await firstValueFrom(
      this.httpService.post(`${GRAPH_API_BASE}/${phoneId}/calls`, body, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }),
    );
    const callId = resp.data?.calls?.[0]?.id as string | undefined;
    if (callId) {
      this.activeCalls.set(callId, {
        callId,
        phoneId,
        direction: 'BUSINESS_INITIATED',
        status: 'initiating',
        from: phoneId,
        to: dto.to,
        sdp: dto.sdp,
        startedAt: Date.now(),
      });
    }
    this.logger.log(`Chamada de saída iniciada para ${dto.to} (callId=${callId || 'n/a'})`);
    return { success: !!callId, callId, meta: resp.data };
  }

  async callAction(dto: CallActionDto) {
    const { token, phoneId } = await this.getConfig();
    const action = dto.action as CallAction;
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      call_id: dto.callId,
      action,
    };
    if ((action === 'pre_accept' || action === 'accept') && dto.sdp) {
      body.session = { sdp_type: 'answer', sdp: dto.sdp };
    }
    const resp = await firstValueFrom(
      this.httpService.post(`${GRAPH_API_BASE}/${phoneId}/calls`, body, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }),
    );
    const prev = this.activeCalls.get(dto.callId);
    if (prev) {
      prev.status = action;
      this.activeCalls.set(dto.callId, prev);
    }
    this.logger.log(`Ação de chamada executada: ${action} (callId=${dto.callId})`);
    return { success: true, meta: resp.data };
  }

  async getCallPermission(userWaId: string) {
    const { token, phoneId } = await this.getConfig();
    const url = `${GRAPH_API_BASE}/${phoneId}/call_permissions?user_wa_id=${encodeURIComponent(userWaId)}`;
    const resp = await firstValueFrom(
      this.httpService.get(url, { headers: { Authorization: `Bearer ${token}` } }),
    );
    return resp.data;
  }

  // ---------------------------------------------------------------------------
  // Persistência
  // ---------------------------------------------------------------------------

  private async saveLog(state: CallState): Promise<void> {
    const customerPhone = state.direction === 'USER_INITIATED' ? state.from : state.to;
    let log = await this.ctiLogRepository.findOne({ where: { call_id: state.callId } });
    if (!log) {
      const { ticket } = await this.whatsappService.findOrCreateTicketForPhone(
        customerPhone,
        state.callerName || 'Cliente',
        `Chamada de voz WhatsApp - ${state.callerName || customerPhone}`,
      );
      log = this.ctiLogRepository.create({
        call_id: state.callId,
        direction: state.direction === 'BUSINESS_INITIATED' ? 'out' : 'in',
        from: state.from,
        to: state.to,
        state: state.status || 'newCall',
        caller_name: state.callerName || null,
        ticket_id: ticket?.id || null,
        sdp: state.sdp || null,
      });
      await this.ctiLogRepository.save(log);
      this.logger.log(`CtiLog criado para chamada ${state.callId} (ticket #${ticket?.id})`);
      return;
    }
    log.state = state.status || log.state;
    if (state.sdp) log.sdp = state.sdp;
    await this.ctiLogRepository.save(log);
  }

  private async finalizeLog(state: CallState, duration?: number, finalStatus?: string): Promise<void> {
    let log = await this.ctiLogRepository.findOne({ where: { call_id: state.callId } });
    if (!log) {
      const customerPhone = state.direction === 'USER_INITIATED' ? state.from : state.to;
      const { ticket } = await this.whatsappService.findOrCreateTicketForPhone(
        customerPhone,
        state.callerName || 'Cliente',
        `Chamada de voz WhatsApp - ${state.callerName || customerPhone}`,
      );
      log = this.ctiLogRepository.create({
        call_id: state.callId,
        direction: state.direction === 'BUSINESS_INITIATED' ? 'out' : 'in',
        from: state.from,
        to: state.to,
        state: finalStatus || 'terminated',
        caller_name: state.callerName || null,
        ticket_id: ticket?.id || null,
      });
    }
    log.done = true;
    log.state = finalStatus || log.state;
    if (duration) log.duration = duration;
    await this.ctiLogRepository.save(log);
    if (log.ticket_id) {
      await this.whatsappService.addCallArticle(log.ticket_id, state, duration);
    }
    this.logger.log(`Chamada ${state.callId} finalizada (${finalStatus || 'n/a'}, ${duration ?? 0}s)`);
  }
}