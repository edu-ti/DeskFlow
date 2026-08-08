import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  
  // In-memory cache for fast lookups (since settings rarely change)
  private cache: Record<string, string> = {};
  private cacheLoaded = false;

  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async loadCache() {
    const settings = await this.settingsRepository.find();
    this.cache = {};
    settings.forEach(s => {
      this.cache[s.key] = s.value;
    });
    this.cacheLoaded = true;
  }

  async getSetting(key: string, defaultValue?: string): Promise<string | undefined> {
    if (!this.cacheLoaded) {
      await this.loadCache();
    }
    return this.cache[key] !== undefined ? this.cache[key] : defaultValue;
  }

  async getAllSettings(): Promise<Record<string, string>> {
    if (!this.cacheLoaded) {
      await this.loadCache();
    }
    return { ...this.cache };
  }

  async updateSettings(settings: Record<string, string>): Promise<void> {
    const entities: Setting[] = [];
    
    for (const [key, value] of Object.entries(settings)) {
      const setting = new Setting();
      setting.key = key;
      setting.value = value;
      entities.push(setting);
      
      // Update cache
      this.cache[key] = value;
    }

    if (entities.length > 0) {
      await this.settingsRepository.save(entities);
      this.logger.log(`Updated ${entities.length} settings`);
    }
  }
}
