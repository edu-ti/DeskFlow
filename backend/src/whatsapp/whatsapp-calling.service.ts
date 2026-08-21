import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from '../settings/services/settings.service';
import { CtiLog } from '../cti/entities/cti-log.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AuditService } from '../audit/services/audit.service';
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

export interface ConsentEntry {
  grantedAt: string;
  method?: string;
  by?: number;
}

interface CallingPolicy {
  requireConsent: boolean;
  maxCallsPerAgentPerDay: number;
  maxConcurrentCalls: number;
  retentionDays: number;
  anonymizeDays: number;
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
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly auditService: AuditService,
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

  private async getPolicy(): Promise<CallingPolicy> {
    const [requireConsent, maxPerDay, maxConcurrent, retentionDays, anonymizeDays] = await Promise.all([
      this.settingsService.getSetting('calling_require_consent', 'true'),
      this.settingsService.getSetting('calling_max_calls_per_day_per_agent', '50'),
      this.settingsService.getSetting('calling_max_concurrent_calls', '5'),
      this.settingsService.getSetting('calling_log_retention_days', '90'),
      this.settingsService.getSetting('calling_log_anonymize_days', '30'),
    ]);
    return {
      requireConsent: requireConsent !== 'false',
      maxCallsPerAgentPerDay: Math.max(1, parseInt(maxPerDay || '50', 10) || 50),
      maxConcurrentCalls: Math.max(1, parseInt(maxConcurrent || '5', 10) || 5),
      retentionDays: Math.max(1, parseInt(retentionDays || '90', 10) || 90),
      anonymizeDays: Math.max(1, parseInt(anonymizeDays || '30', 10) || 30),
    };
  }

  private async getConsentMap(): Promise<Record<string, ConsentEntry>> {
    const raw = await this.settingsService.getSetting('calling_consents', '{}');
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private async saveConsentMap(map: Record<string, ConsentEntry>): Promise<void> {
    await this.settingsService.updateSettings({ calling_consents: JSON.stringify(map) });
  }

  // ---------------------------------------------------------------------------
  // Configuração / elegibilidade (Fase 1)
  // ---------------------------------------------------------------------------

  private isEligibleTier(tier?: string): boolean {
    if (!tier) return false;
    if (tier === 'TIER_1K') return false;
    return /^TIER_(10K|50K|100K|250K|UNLIMITED)$/.test(tier);
  }

  async getCallingEligibility(userId: number, req?: any) {
    const { token, phoneId } = await this.getConfig();
    const url = `${GRAPH_API_BASE}/${phoneId}?fields=messaging_limit_tier,quality_rating,throughput,display_phone_number,verified_name`;
    const resp = await firstValueFrom(
      this.httpService.get(url, { headers: { Authorization: `Bearer ${token}` } }),
    );
    const tier = resp.data.messaging_limit_tier as string | undefined;
    const eligible = this.isEligibleTier(tier);

    await this.auditService.logAction(
      userId,
      'CALL_ELIGIBILITY_CHECK',
      'call',
      phoneId,
      undefined,
      { tier, eligible },
      `Verificação de elegibilidade de chamadas (tier=${tier || 'UNKNOWN'})`,
      req,
    );

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

  async updateCallSettings(dto: UpdateCallSettingsDto, userId: number, req?: any) {
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
    await this.auditService.logAction(
      userId,
      'CALL_SETTINGS_UPDATE',
      'call',
      phoneId,
      undefined,
      calling,
      `Atualização das configurações de chamadas na Meta (status=${dto.status})`,
      req,
    );
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
  // Consentimento LGPD (Fase 4)
  // ---------------------------------------------------------------------------

  async recordConsent(dto: { user_wa_id: string; method?: string }, userId: number, req?: any) {
    const waId = dto.user_wa_id.replace(/\D/g, '');
    if (!waId) throw new BadRequestException('user_wa_id é obrigatório.');

    const map = await this.getConsentMap();
    map[waId] = { grantedAt: new Date().toISOString(), method: dto.method || 'manual', by: userId };
    await this.saveConsentMap(map);

    await this.auditService.logAction(
      userId,
      'CALL_CONSENT_GRANT',
      'call',
      waId,
      undefined,
      { method: dto.method || 'manual' },
      `Consentimento para chamadas de voz registrado para o WhatsApp ${waId} (LGPD).`,
      req,
    );

    return {
      success: true,
      message: 'Consentimento registrado com sucesso. O cliente poderá receber chamadas de voz.',
      wa_id: waId,
      granted_at: map[waId].grantedAt,
    };
  }

  async getConsent(userWaId: string, userId: number, req?: any) {
    const waId = userWaId.replace(/\D/g, '');
    if (!waId) throw new BadRequestException('user_wa_id é obrigatório.');

    const map = await this.getConsentMap();
    const local = map[waId] || null;

    let metaPermission: any = null;
    try {
      metaPermission = await this.getMetaCallPermission(waId);
    } catch (e) {
      this.logger.warn(`Falha ao consultar permissão de chamada na Meta para ${waId}: ${(e as Error).message}`);
    }

    await this.auditService.logAction(
      userId,
      'CALL_PERMISSION_CHECK',
      'call',
      waId,
      undefined,
      { consent: local ? 'granted' : 'none', meta: metaPermission },
      `Verificação de consentimento/permissão de chamada para o WhatsApp ${waId}.`,
      req,
    );

    return {
      wa_id: waId,
      consent: local,
      granted: !!local,
      meta_permission: metaPermission,
      allowed: !!local && !!metaPermission,
    };
  }

  async revokeConsent(userWaId: string, userId: number, req?: any) {
    const waId = userWaId.replace(/\D/g, '');
    const map = await this.getConsentMap();
    if (!map[waId]) throw new NotFoundException('Consentimento não encontrado para este WhatsApp.');

    delete map[waId];
    await this.saveConsentMap(map);

    await this.auditService.logAction(
      userId,
      'CALL_CONSENT_REVOKE',
      'call',
      waId,
      { grantedAt: undefined },
      { status: 'REVOKED' },
      `Consentimento para chamadas de voz revogado para o WhatsApp ${waId} (LGPD - direito de objeção).`,
      req,
    );

    return { success: true, message: 'Consentimento revogado. Chamadas de saída para este número foram bloqueadas.' };
  }

  // ---------------------------------------------------------------------------
  // Gerenciamento de logs (Fase 4)
  // ---------------------------------------------------------------------------

  async listLogs(query: { page?: number; limit?: number; ticket_id?: number }, userId: number, req?: any) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const qb = this.ctiLogRepository
      .createQueryBuilder('log')
      .orderBy('log.created_at', 'DESC');

    if (query.ticket_id) {
      qb.andWhere('log.ticket_id = :ticket_id', { ticket_id: query.ticket_id });
    }

    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    await this.auditService.logAction(
      userId,
      'CALL_LOGS_VIEW',
      'call',
      undefined,
      undefined,
      { page, limit, total },
      'Consulta aos registros de chamadas (logs do sistema de telefonia).',
      req,
    );

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteLog(id: number, userId: number, req?: any) {
    const log = await this.ctiLogRepository.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Registro de chamada não encontrado.');

    await this.ctiLogRepository.delete(id);

    await this.auditService.logAction(
      userId,
      'CALL_LOG_ERASE',
      'call',
      id,
      { call_id: log.call_id, from: log.from, to: log.to },
      { status: 'ERASED' },
      `Registro de chamada #${id} apagado conforme LGPD (direito ao apagamento).`,
      req,
    );

    return { success: true, message: 'Registro de chamada apagado.' };
  }

  async purgeExpiredLogs(): Promise<{ deleted: number; anonymized: number }> {
    const policy = await this.getPolicy();
    const now = new Date();

    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - policy.retentionDays);
    const anonymizeCutoff = new Date(now);
    anonymizeCutoff.setDate(anonymizeCutoff.getDate() - policy.anonymizeDays);

    const expired = await this.ctiLogRepository.find({ where: { created_at: LessThan(cutoff) } });
    if (expired.length > 0) {
      await this.ctiLogRepository.remove(expired);
    }

    const toAnonymize = await this.ctiLogRepository.find({
      where: { created_at: LessThan(anonymizeCutoff) },
    });
    let anonymized = 0;
    for (const log of toAnonymize) {
      if (log.caller_name || log.sdp) {
        log.caller_name = null;
        log.sdp = null;
        await this.ctiLogRepository.save(log);
        anonymized++;
      }
    }

    if (expired.length > 0 || anonymized > 0) {
      await this.auditService.logAction(
        null,
        'CALL_PURGE',
        'call',
        undefined,
        undefined,
        { deleted: expired.length, anonymized },
        `Retenção de logs de chamadas: ${expired.length} excluídos (> ${policy.retentionDays} dias) e ${anonymized} anonimizados (> ${policy.anonymizeDays} dias).`,
      );
      this.logger.log(`Purge de logs de chamadas: ${expired.length} excluídos, ${anonymized} anonimizados`);
    }

    return { deleted: expired.length, anonymized };
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

        if (direction === 'BUSINESS_INITIATED') {
          await this.saveLog(state);
          await this.auditService.logAction(
            null,
            'CALL_CONNECTED',
            'call',
            callId,
            undefined,
            { direction, from, to },
            `Chamada de saída conectada (${from} → ${to}).`,
          );
          this.notificationsGateway.sendCallEvent('call_state', { callId, status: 'connected', sdp });
        } else if (sdp) {
          await this.saveLog(state);
          await this.auditService.logAction(
            null,
            'CALL_RECEIVED',
            'call',
            callId,
            undefined,
            { from, to, callerName },
            `Chamada de voz recebida de ${callerName || from}.`,
          );
          this.notificationsGateway.sendCallEvent('call_incoming', {
            callId, from, to, callerName, phoneId, sdp,
          });
        } else {
          this.notificationsGateway.sendCallEvent('call_ringing', {
            callId, from, to, callerName,
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
        await this.auditService.logAction(
          null,
          'CALL_FINALIZED',
          'call',
          callId,
          undefined,
          { status: finalStatus, duration: callDuration ?? null },
          `Chamada finalizada (${finalStatus}${callDuration ? `, ${callDuration}s` : ''}).`,
        );
        this.notificationsGateway.sendCallEvent('call_terminated', {
          callId, from, to, status: finalStatus, duration: callDuration ?? null,
        });
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook de chamada', error);
    }
  }

  async initiateCall(dto: InitiateCallDto, userId: number, req?: any) {
    const { token, phoneId } = await this.getConfig();
    const policy = await this.getPolicy();

    // Limite de chamadas simultâneas
    if (this.activeCalls.size >= policy.maxConcurrentCalls) {
      throw new ForbiddenException(
        `Limite de chamadas simultâneas atingido (${policy.maxConcurrentCalls}). Aguarde a conclusão de uma chamada ativa.`,
      );
    }

    // Limite diário por agente
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const agentToday = await this.auditLogRepository.count({
      where: {
        action: 'CALL_INITIATE',
        user_id: userId,
        created_at: MoreThan(since24h),
      },
    });
    if (agentToday >= policy.maxCallsPerAgentPerDay) {
      throw new ForbiddenException(
        `Limite diário de chamadas de saída atingido (${policy.maxCallsPerAgentPerDay} nas últimas 24h). Tente novamente amanhã.`,
      );
    }

    // Consentimento LGPD
    const waId = dto.to.replace(/\D/g, '');
    const consentMap = await this.getConsentMap();
    const hasConsent = !!consentMap[waId];
    if (policy.requireConsent && !hasConsent) {
      throw new ForbiddenException(
        'Consentimento obrigatório (LGPD): registre o consentimento do cliente antes de iniciar a chamada (use o endpoint de consentimento ou solicite a autorização via mensagem).',
      );
    }

    // Permissão da Meta
    let metaAllowed = true;
    try {
      const permission = await this.getMetaCallPermission(waId);
      metaAllowed = permission?.allow_call !== false;
    } catch (e) {
      if (policy.requireConsent) {
        throw new BadRequestException(
          `Não foi possível verificar a permissão de chamada na Meta para ${waId}: ${(e as Error).message}`,
        );
      }
      metaAllowed = false;
    }
    if (!metaAllowed) {
      throw new ForbiddenException(
        'O cliente ainda não concedeu permissão para chamadas de voz na WhatsApp. Envie uma mensagem solicitando autorização e aguarde a aprovação antes de ligar.',
      );
    }

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

    await this.auditService.logAction(
      userId,
      'CALL_INITIATE',
      'call',
      callId || waId,
      undefined,
      { to: dto.to, consent: hasConsent, concurrent_active: this.activeCalls.size },
      `Chamada de voz de saída iniciada para ${dto.to} (callId=${callId || 'n/a'}).`,
      req,
    );

    this.logger.log(`Chamada de saída iniciada para ${dto.to} (callId=${callId || 'n/a'})`);
    return { success: !!callId, callId, meta: resp.data };
  }

  async callAction(dto: CallActionDto, userId: number, req?: any) {
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

    await this.auditService.logAction(
      userId,
      'CALL_ACTION',
      'call',
      dto.callId,
      undefined,
      { action },
      `Ação ${action.toUpperCase()} executada na chamada ${dto.callId}.`,
      req,
    );

    this.logger.log(`Ação de chamada executada: ${action} (callId=${dto.callId})`);
    return { success: true, meta: resp.data };
  }

  private async getMetaCallPermission(userWaId: string) {
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