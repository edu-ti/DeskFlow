import { addDays, addHours, isWeekend, setHours, setMinutes, setSeconds, getHours } from 'date-fns';

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
   */
  static addBusinessHours(startDate: Date, hoursToAdd: number): Date {
    let currentDate = new Date(startDate);
    let remainingHours = hoursToAdd;

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

    while (remainingHours > 0) {
      const hoursUntilEndOfDay = this.END_HOUR - getHours(currentDate);

      if (remainingHours <= hoursUntilEndOfDay) {
        // Consegue terminar no mesmo dia
        currentDate = addHours(currentDate, remainingHours);
        remainingHours = 0;
      } else {
        // Não consegue terminar hoje, consome as horas até o fim do dia
        remainingHours -= hoursUntilEndOfDay;
        // Pula para o próximo dia útil às 08:00
        currentDate = this.moveToNextBusinessDay(currentDate);
      }
    }

    return currentDate;
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
