import { BusinessHoursUtil } from './business-hours.util';

describe('BusinessHoursUtil', () => {
  describe('Standard Calendar (08:00 to 18:00, Mon-Fri)', () => {
    it('should add hours within the same business day', () => {
      // Monday 10:00 AM UTC
      const start = new Date('2023-10-02T10:00:00Z');
      
      // Add 2 hours -> Monday 12:00 PM
      const result = BusinessHoursUtil.addBusinessHours(start, 2, 'UTC', 'standard_8_18');
      
      expect(result.toISOString()).toBe(new Date('2023-10-02T12:00:00.000Z').toISOString());
    });

    it('should roll over to the next business day if hours exceed today', () => {
      // Monday 17:00 PM UTC
      const start = new Date('2023-10-02T17:00:00Z');
      
      // Add 2 hours -> Tuesday 09:00 AM (1h today + 1h tomorrow from 08:00)
      const result = BusinessHoursUtil.addBusinessHours(start, 2, 'UTC', 'standard_8_18');
      
      expect(result.toISOString()).toBe(new Date('2023-10-03T09:00:00.000Z').toISOString());
    });

    it('should skip weekends', () => {
      // Friday 17:00 PM UTC
      const start = new Date('2023-10-06T17:00:00Z');
      
      // Add 2 hours -> Monday 09:00 AM (1h on Friday + 1h on Monday)
      const result = BusinessHoursUtil.addBusinessHours(start, 2, 'UTC', 'standard_8_18');
      
      expect(result.toISOString()).toBe(new Date('2023-10-09T09:00:00.000Z').toISOString());
    });

    it('should handle start times before business hours', () => {
      // Monday 06:00 AM UTC
      const start = new Date('2023-10-02T06:00:00Z');
      
      // Add 1 hour -> Monday 09:00 AM (starts counting from 08:00)
      const result = BusinessHoursUtil.addBusinessHours(start, 1, 'UTC', 'standard_8_18');
      
      expect(result.toISOString()).toBe(new Date('2023-10-02T09:00:00.000Z').toISOString());
    });

    it('should handle start times after business hours', () => {
      // Monday 20:00 PM UTC
      const start = new Date('2023-10-02T20:00:00Z');
      
      // Add 1 hour -> Tuesday 09:00 AM
      const result = BusinessHoursUtil.addBusinessHours(start, 1, 'UTC', 'standard_8_18');
      
      expect(result.toISOString()).toBe(new Date('2023-10-03T09:00:00.000Z').toISOString());
    });
  });

  describe('Extended Calendar (08:00 to 21:00, Sun-Sat)', () => {
    it('should work on Saturdays and Sundays in extended calendar', () => {
      // Saturday 10:00 AM UTC
      const start = new Date('2023-10-07T10:00:00Z');
      
      // Add 2 hours -> Saturday 12:00 PM
      const result = BusinessHoursUtil.addBusinessHours(start, 2, 'UTC', 'extended_8_21');
      
      expect(result.toISOString()).toBe(new Date('2023-10-07T12:00:00.000Z').toISOString());
    });

    it('should stay open until 21:00 in extended calendar', () => {
      // Friday 19:00 PM UTC
      const start = new Date('2023-10-06T19:00:00Z');
      
      // Add 2 hours -> Friday 21:00 PM
      const result = BusinessHoursUtil.addBusinessHours(start, 2, 'UTC', 'extended_8_21');
      
      expect(result.toISOString()).toBe(new Date('2023-10-06T21:00:00.000Z').toISOString());
    });

    it('should rollover after 21:00 to the next morning at 08:00 (including Sunday)', () => {
      // Saturday 20:30 PM UTC
      const start = new Date('2023-10-07T20:30:00Z');
      
      // Add 1 hour (30 min on Saturday + 30 min on Sunday from 08:00 -> Sunday 08:30)
      const result = BusinessHoursUtil.addMinutes(start, 60, 'UTC', 'extended_8_21');
      
      expect(result.toISOString()).toBe(new Date('2023-10-08T08:30:00.000Z').toISOString());
    });
  });

  describe('isWithinBusinessHours', () => {
    it('should return true when inside standard hours on a weekday', () => {
      // Wednesday 14:30 PM UTC
      const testDate = new Date('2023-10-04T14:30:00Z');
      const status = BusinessHoursUtil.isWithinBusinessHours(testDate, 'standard_8_18', 'UTC');
      expect(status.isOpen).toBe(true);
    });

    it('should return false on Sunday for standard calendar and give next Monday at 08:00', () => {
      // Sunday 14:00 PM UTC (2023-10-08)
      const testDate = new Date('2023-10-08T14:00:00Z');
      const status = BusinessHoursUtil.isWithinBusinessHours(testDate, 'standard_8_18', 'UTC');
      expect(status.isOpen).toBe(false);
      expect(status.nextOpeningDate.toISOString()).toBe(new Date('2023-10-09T08:00:00.000Z').toISOString());
    });

    it('should return true on Sunday at 14:00 for extended calendar', () => {
      // Sunday 14:00 PM UTC (2023-10-08)
      const testDate = new Date('2023-10-08T14:00:00Z');
      const status = BusinessHoursUtil.isWithinBusinessHours(testDate, 'extended_8_21', 'UTC');
      expect(status.isOpen).toBe(true);
    });

    it('should return false after 21:00 on extended calendar and give tomorrow at 08:00', () => {
      // Sunday 22:00 PM UTC (2023-10-08)
      const testDate = new Date('2023-10-08T22:00:00Z');
      const status = BusinessHoursUtil.isWithinBusinessHours(testDate, 'extended_8_21', 'UTC');
      expect(status.isOpen).toBe(false);
      expect(status.nextOpeningDate.toISOString()).toBe(new Date('2023-10-09T08:00:00.000Z').toISOString());
    });
  });
});
