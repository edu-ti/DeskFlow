import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsappCallingService } from './whatsapp-calling.service';

@Injectable()
export class CallingMaintenanceService {
  private readonly logger = new Logger(CallingMaintenanceService.name);

  constructor(private readonly callingService: WhatsappCallingService) {}

  /**
   * Retenção de logs de chamadas: exclui logs mais antigos que a política e
   * anonimiza dados sensíveis (SDP/identificação) em logs antigos (LGPD).
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleCallLogRetention() {
    try {
      const result = await this.callingService.purgeExpiredLogs();
      if (result.deleted > 0 || result.anonymized > 0) {
        this.logger.log(
          `[RETENÇÃO CALLS] ${result.deleted} logs excluídos, ${result.anonymized} anonimizados`,
        );
      }
    } catch (error) {
      this.logger.error('Falha na rotina de retenção de logs de chamadas', error);
    }
  }
}