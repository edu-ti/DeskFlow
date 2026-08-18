import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/services/settings.service';

@Injectable()
export class IntegrationsService {
  constructor(private readonly settingsService: SettingsService) {}

  async listIssueTrackers(): Promise<{ provider: string; configured: boolean }[]> {
    const providers = ['github', 'gitlab', 'jira', 'servicenow', 'idoit'];
    const result: { provider: string; configured: boolean }[] = [];
    for (const provider of providers) {
      const token = await this.settingsService.getSetting(`ISSUE_${provider.toUpperCase()}_TOKEN`);
      result.push({ provider, configured: !!token });
    }
    return result;
  }

  async listMonitoring(): Promise<{ provider: string; configured: boolean }[]> {
    const providers = ['checkmk', 'icinga', 'nagios', 'monit'];
    const result: { provider: string; configured: boolean }[] = [];
    for (const provider of providers) {
      const url = await this.settingsService.getSetting(`MONITORING_${provider.toUpperCase()}_URL`);
      result.push({ provider, configured: !!url });
    }
    return result;
  }
}
