import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { User } from '../iam/entities/user.entity';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  parseCsv(csvText: string): Record<string, string>[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return [];
    const headers = this.splitCsvLine(lines[0]);
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.splitCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = (values[idx] || '').trim();
      });
      rows.push(row);
    }
    return rows;
  }

  private splitCsvLine(line: string): string[] {
    // Minimal CSV parser supporting quoted fields.
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        out.push(current);
        current = '';
      } else {
        current += c;
      }
    }
    out.push(current);
    return out;
  }

  async importCsv(rows: Record<string, string>[]): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;
    for (const row of rows) {
      if (!row.title && !row.Title) {
        skipped++;
        continue;
      }
      const title = row.title || row.Title;
      const email = row.customer_email || row.email || row.Email;
      let customer = null;
      if (email) {
        customer = await this.userRepository.findOne({ where: { email } });
      }
      const ticket = this.ticketRepository.create({
        title,
        state_id: 1,
        priority_id: 2,
        customer_id: customer?.id,
        group_id: parseInt(row.group_id || '1', 10) || undefined,
        source: 'import',
      });
      await this.ticketRepository.save(ticket);
      imported++;
    }
    return { imported, skipped };
  }

  // External imports require provider access/credentials; these are stubs
  // that document the integration point.
  async importFrom(source: string): Promise<{ source: string; status: string }> {
    this.logger.warn(`Import from ${source} requested (integration point; credentials required)`);
    return { source, status: 'not_configured' };
  }
}
