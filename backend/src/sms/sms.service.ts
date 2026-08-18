import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../settings/services/settings.service';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly settingsService: SettingsService) {}

  async sendSms(to: string, message: string): Promise<{ driver: string; result: any }> {
    const driver = (await this.settingsService.getSetting('SMS_DRIVER')) || 'twilio';
    switch (driver) {
      case 'twilio':
        return { driver, result: await this.sendTwilio(to, message) };
      case 'messagebird':
        return { driver, result: await this.sendMessageBird(to, message) };
      case 'massenversand':
        return { driver, result: await this.sendMassenversand(to, message) };
      default:
        throw new BadRequestException(`Unsupported SMS driver: ${driver}`);
    }
  }

  private async sendTwilio(to: string, message: string) {
    const sid = await this.settingsService.getSetting('SMS_TWILIO_SID');
    const token = await this.settingsService.getSetting('SMS_TWILIO_TOKEN');
    const from = await this.settingsService.getSetting('SMS_TWILIO_FROM');
    if (!sid || !token || !from) {
      this.logger.warn('Twilio SMS not configured');
      return { skipped: true, reason: 'twilio_not_configured' };
    }
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      new URLSearchParams({ To: to, From: from, Body: message }).toString(),
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    return response.data;
  }

  private async sendMessageBird(to: string, message: string) {
    const key = await this.settingsService.getSetting('SMS_MESSAGEBIRD_KEY');
    const originator = await this.settingsService.getSetting('SMS_MESSAGEBIRD_ORIGINATOR');
    if (!key) {
      return { skipped: true, reason: 'messagebird_not_configured' };
    }
    const response = await axios.post(
      'https://rest.messagebird.com/messages',
      { recipients: [to], body: message, originator },
      { headers: { Authorization: `AccessKey ${key}` } },
    );
    return response.data;
  }

  private async sendMassenversand(to: string, message: string) {
    const token = await this.settingsService.getSetting('SMS_MASSENVERSAND_TOKEN');
    const sender = await this.settingsService.getSetting('SMS_MASSENVERSAND_SENDER');
    if (!token) {
      return { skipped: true, reason: 'massenversand_not_configured' };
    }
    const response = await axios.post('https://app.massenversand.de/api/v2/sms', {
      message,
      recipient: to,
      sender,
      authToken: token,
    });
    return response.data;
  }
}
