import { addDays, addHours, addMinutes, isWeekend, setHours, setMinutes, setSeconds, getHours, getMinutes, differenceInMinutes } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Utilitário para calcular SLAs com base no calendário comercial.
 * Configuração atual: Segunda a Sexta, das 08:00 às 18:00.
 */
export class BusinessHoursUtil {
  static readonly START_HOUR = 8;
  static readonly END_HOUR = 18;

  /**
   * Adiciona um número de horas úteis a uma data inicial.
   * Pula finais de semana e horários fora do expediente (antes das 08:00 e depois das 18:00).
   * Considera o fuso horário (padrão: America/Sao_Paulo)
   */
  static addBusinessHours(startDate: Date, hoursToAdd: number, timeZone = 'America/Sao_Paulo'): Date {
    return this.addMinutes(startDate, hoursToAdd * 60, timeZone);
  }

  /**
   * Adiciona um número de minutos úteis a uma data inicial.
   */
  static addMinutes(startDate: Date, minutesToAdd: number, timeZone = 'America/Sao_Paulo'): Date {
    let currentDate = toZonedTime(startDate, timeZone);
    let remainingMinutes = minutesToAdd;

    // Se começou no fim de semana, move para segunda-feira às 08:00
    if (isWeekend(currentDate)) {
      currentDate = this.moveToNextBusinessDay(currentDate);
    } 
    // Se começou antes das 08h, move para 08h
    else if (getHours(currentDate) < this.START_HOUR) {
      currentDate = setHours(setMinutes(setSeconds(currentDate, 0), 0), this.START_HOUR);
    }
    // Se começou depois das 18h, move para o próximo dia às 08h
    else if (getHours(currentDate) >= this.END_HOUR) {
      currentDate = this.moveToNextBusinessDay(currentDate);
    }

    while (remainingMinutes > 0) {
      const endOfDay = setHours(setMinutes(setSeconds(currentDate, 0), 0), this.END_HOUR);
      const minutesUntilEndOfDay = differenceInMinutes(endOfDay, currentDate);

      if (remainingMinutes <= minutesUntilEndOfDay) {
        // Consegue terminar no mesmo dia
        currentDate = addMinutes(currentDate, remainingMinutes);
        remainingMinutes = 0;
      } else {
        // Não consegue terminar hoje, consome os minutos até o fim do dia
        remainingMinutes -= minutesUntilEndOfDay;
        // Pula para o próximo dia útil às 08:00
        currentDate = this.moveToNextBusinessDay(currentDate);
      }
    }

    return fromZonedTime(currentDate, timeZone);
  }

  private static moveToNextBusinessDay(date: Date): Date {
    let nextDay = addDays(date, 1);
    
    // Se caiu no sábado (6) ou domingo (0), avança até segunda
    while (isWeekend(nextDay)) {
      nextDay = addDays(nextDay, 1);
    }

    return setHours(setMinutes(setSeconds(nextDay, 0), 0), this.START_HOUR);
  }
}
