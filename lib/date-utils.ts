import { addDays, isWeekend, startOfDay } from "date-fns";

/**
 * Calculates a date that is N business days (Mon-Fri) from the start date.
 */
export function addBusinessDays(startDate: Date, days: number): Date {
  let currentDate = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < days) {
    currentDate = addDays(currentDate, 1);
    if (!isWeekend(currentDate)) {
      daysAdded++;
    }
  }
  
  return currentDate;
}

export function getSevenBusinessDaysRange() {
  const now = startOfDay(new Date());
  const end = addBusinessDays(now, 7);
  return { start: now, end };
}
