import { BusinessHoursUtil } from './business-hours.util';

describe('BusinessHoursUtil', () => {
  describe('addBusinessHours', () => {
    it('should add hours within the same business day', () => {
      // Monday 10:00 AM
      const start = new Date('2023-10-02T10:00:00Z');
      
      // Add 2 hours -> Monday 12:00 PM
      const result = BusinessHoursUtil.addBusinessHours(start, 2, 'UTC');
      
      expect(result.toISOString()).toBe(new Date('2023-10-02T12:00:00.000Z').toISOString());
    });

    it('should roll over to the next business day if hours exceed today', () => {
      // Monday 17:00 PM
      const start = new Date('2023-10-02T17:00:00Z');
      
      // Add 2 hours -> Tuesday 09:00 AM (assuming 8 to 18)
      const result = BusinessHoursUtil.addBusinessHours(start, 2, 'UTC');
      
      expect(result.toISOString()).toBe(new Date('2023-10-03T09:00:00.000Z').toISOString());
    });

    it('should skip weekends', () => {
      // Friday 17:00 PM
      const start = new Date('2023-10-06T17:00:00Z');
      
      // Add 2 hours -> Monday 10:00 AM
      const result = BusinessHoursUtil.addBusinessHours(start, 2, 'UTC');
      
      expect(result.toISOString()).toBe(new Date('2023-10-09T09:00:00.000Z').toISOString());
    });

    it('should handle start times before business hours', () => {
      // Monday 06:00 AM
      const start = new Date('2023-10-02T06:00:00Z');
      
      // Add 1 hour -> Monday 10:00 AM
      const result = BusinessHoursUtil.addBusinessHours(start, 1, 'UTC');
      
      expect(result.toISOString()).toBe(new Date('2023-10-02T09:00:00.000Z').toISOString());
    });

    it('should handle start times after business hours', () => {
      // Monday 20:00 PM
      const start = new Date('2023-10-02T20:00:00Z');
      
      // Add 1 hour -> Tuesday 10:00 AM
      const result = BusinessHoursUtil.addBusinessHours(start, 1, 'UTC');
      
      expect(result.toISOString()).toBe(new Date('2023-10-03T09:00:00.000Z').toISOString());
    });
  });
});
