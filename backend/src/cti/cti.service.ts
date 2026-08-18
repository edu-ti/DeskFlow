import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtiLog } from './entities/cti-log.entity';
import { SettingsService } from '../settings/services/settings.service';

@Injectable()
export class CtiService {
  constructor(
    @InjectRepository(CtiLog)
    private readonly ctiLogRepository: Repository<CtiLog>,
    private readonly settingsService: SettingsService,
  ) {}

  async listLogs(): Promise<CtiLog[]> {
    return this.ctiLogRepository.find({ order: { created_at: 'DESC' } });
  }

  async createLog(data: Partial<CtiLog>): Promise<CtiLog> {
    return this.ctiLogRepository.save(this.ctiLogRepository.create(data));
  }

  async markDone(id: number, comment?: string): Promise<CtiLog> {
    const log = await this.ctiLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException('CTI log not found');
    }
    log.done = true;
    if (comment) {
      log.comment = comment;
    }
    return this.ctiLogRepository.save(log);
  }

  // Provider-agnostic incoming call hook (Placetel / Sipgate / generic).
  // Real providers must POST here; the driver name selects any adapter needed.
  async incomingCall(payload: { direction?: string; from: string; to: string; call_id?: string; queue?: string }): Promise<CtiLog> {
    const driver = (await this.settingsService.getSetting('CTI_DRIVER')) || 'generic';
    this.loggerNote(driver, payload);
    return this.createLog({ ...payload, direction: payload.direction || 'in', state: 'newCall' });
  }

  private loggerNote(driver: string, payload: any) {
    // Placeholder for driver-specific normalization (Placetel, Sipgate.io, etc.)
    // eslint-disable-next-line no-console
    console.log(`[CTI:${driver}] incoming call from=${payload.from} to=${payload.to}`);
  }
}
