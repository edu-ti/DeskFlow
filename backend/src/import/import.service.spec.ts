import { ImportService } from './import.service';

describe('ImportService', () => {
  const service = new ImportService(null as any, null as any);

  describe('parseCsv', () => {
    it('returns empty array for empty input', () => {
      expect(service.parseCsv('')).toEqual([]);
    });

    it('parses header and data rows', () => {
      const csv = 'title,customer_email,group_id\n"Erro no login",cliente@x.com,2\n';
      const rows = service.parseCsv(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        title: 'Erro no login',
        customer_email: 'cliente@x.com',
        group_id: '2',
      });
    });

    it('handles quoted fields containing commas', () => {
      const csv = 'title,customer_email\n"Problema, urgente",cliente@x.com\n';
      const rows = service.parseCsv(csv);
      expect(rows[0].title).toBe('Problema, urgente');
    });

    it('ignores blank lines', () => {
      const csv = 'title\n\nLinha A\n';
      const rows = service.parseCsv(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].title).toBe('Linha A');
    });
  });
});
