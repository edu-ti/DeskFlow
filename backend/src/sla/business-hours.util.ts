import { addDays, addMinutes as dfAddMinutes, getDay, getHours, getMinutes, setHours, setMinutes, setSeconds, differenceInMinutes } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export type SlaCalendarType = 'standard_8_18' | 'extended_8_21';

export interface CalendarConfig {
  startHour: number;
  endHour: number;
  workDays: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
}

/**
 * Utilitário para calcular SLAs com base em múltiplos calendários comerciais.
 * - standard_8_18: Segunda a Sexta, das 08:00 às 18:00 (pausa finais de semana).
 * - extended_8_21: Domingo a Domingo, das 08:00 às 21:00 (7 dias por semana).
 */
export class BusinessHoursUtil {
  static getCalendarConfig(calendarType: SlaCalendarType | string = 'standard_8_18'): CalendarConfig {
    if (calendarType === 'extended_8_21') {
      return {
        startHour: 8,
        endHour: 21,
        workDays: [0, 1, 2, 3, 4, 5, 6], // Todos os dias
      };
    }

    // Padrão: Segunda a Sexta, das 08:00 às 18:00
    return {
      startHour: 8,
      endHour: 18,
      workDays: [1, 2, 3, 4, 5], // Seg-Sex
    };
  }

  /**
   * Verifica se a data fornecida está dentro do horário de atendimento do calendário.
   * Retorna também o próximo horário de abertura caso esteja fechado.
   */
  static isWithinBusinessHours(
    date: Date,
    calendarType: SlaCalendarType | string = 'standard_8_18',
    timeZone = 'America/Sao_Paulo'
  ): { isOpen: boolean; nextOpeningDate: Date } {
    const config = this.getCalendarConfig(calendarType);
    const zonedDate = toZonedTime(date, timeZone);
    const dayOfWeek = getDay(zonedDate);
    const currentHour = getHours(zonedDate);
    const currentMinutes = getMinutes(zonedDate);

    const isWorkDay = config.workDays.includes(dayOfWeek);
    const isPastStart = currentHour > config.startHour || (currentHour === config.startHour && currentMinutes >= 0);
    const isBeforeEnd = currentHour < config.endHour;

    if (isWorkDay && isPastStart && isBeforeEnd) {
      return {
        isOpen: true,
        nextOpeningDate: fromZonedTime(zonedDate, timeZone),
      };
    }

    // Está fora do horário: calcular próximo início de expediente
    let nextDate = zonedDate;
    if (isWorkDay && currentHour < config.startHour) {
      // Abre hoje mesmo às startHour:00
      nextDate = setHours(setMinutes(setSeconds(nextDate, 0), 0), config.startHour);
    } else {
      // Abre no próximo dia útil às startHour:00
      nextDate = this.moveToNextBusinessDay(nextDate, config);
    }

    return {
      isOpen: false,
      nextOpeningDate: fromZonedTime(nextDate, timeZone),
    };
  }

  /**
   * Adiciona um número de horas úteis a uma data inicial.
   */
  static addBusinessHours(
    startDate: Date,
    hoursToAdd: number,
    timeZone = 'America/Sao_Paulo',
    calendarType: SlaCalendarType | string = 'standard_8_18'
  ): Date {
    return this.addMinutes(startDate, hoursToAdd * 60, timeZone, calendarType);
  }

  /**
   * Adiciona um número de minutos úteis a uma data inicial considerando o calendário escolhido.
   */
  static addMinutes(
    startDate: Date,
    minutesToAdd: number,
    timeZone = 'America/Sao_Paulo',
    calendarType: SlaCalendarType | string = 'standard_8_18'
  ): Date {
    const config = this.getCalendarConfig(calendarType);
    let currentDate = toZonedTime(startDate, timeZone);
    let remainingMinutes = minutesToAdd;

    // Se começou em dia não útil (ex: fim de semana no standard), move para o próximo dia útil
    if (!config.workDays.includes(getDay(currentDate))) {
      currentDate = this.moveToNextBusinessDay(currentDate, config);
    } 
    // Se começou antes da hora de abertura, move para o início do expediente de hoje
    else if (getHours(currentDate) < config.startHour) {
      currentDate = setHours(setMinutes(setSeconds(currentDate, 0), 0), config.startHour);
    }
    // Se começou após o encerramento do expediente, move para o próximo dia útil
    else if (getHours(currentDate) >= config.endHour) {
      currentDate = this.moveToNextBusinessDay(currentDate, config);
    }

    while (remainingMinutes > 0) {
      const endOfDay = setHours(setMinutes(setSeconds(currentDate, 0), 0), config.endHour);
      const minutesUntilEndOfDay = differenceInMinutes(endOfDay, currentDate);

      if (remainingMinutes <= minutesUntilEndOfDay) {
        // Consegue terminar no mesmo dia
        currentDate = dfAddMinutes(currentDate, remainingMinutes);
        remainingMinutes = 0;
      } else {
        // Não consegue terminar hoje, consome os minutos até o fim do expediente
        remainingMinutes -= minutesUntilEndOfDay;
        // Pula para o próximo dia útil às startHour:00
        currentDate = this.moveToNextBusinessDay(currentDate, config);
      }
    }

    return fromZonedTime(currentDate, timeZone);
  }

  private static moveToNextBusinessDay(date: Date, config: CalendarConfig): Date {
    let nextDay = addDays(date, 1);
    
    // Avança até encontrar um dia de trabalho válido (ex: pula sábado e domingo no standard)
    while (!config.workDays.includes(getDay(nextDay))) {
      nextDay = addDays(nextDay, 1);
    }

    return setHours(setMinutes(setSeconds(nextDay, 0), 0), config.startHour);
  }
}
