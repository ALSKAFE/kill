import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DateTime } from "luxon";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to Arabic locale
export function formatDate(date: string | Date, format: string = "dd MMMM yyyy"): string {
  return DateTime.fromISO(date.toString()).setLocale("ar").toFormat(format);
}

// Get first day of month (0-6, Sunday is 0)
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Get days in month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Generate calendar days array for a given month
export function getCalendarDays(year: number, month: number) {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = month === 0 
    ? getDaysInMonth(year - 1, 11) 
    : getDaysInMonth(year, month - 1);
  
  const days = [];
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const date = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    days.push({
      day,
      date,
      isCurrentMonth: false,
      bookings: {}
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    days.push({
      day: i,
      date,
      isCurrentMonth: true,
      bookings: {}
    });
  }
  
  // Next month days
  const remainingDays = 42 - days.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const date = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    days.push({
      day: i,
      date,
      isCurrentMonth: false,
      bookings: {}
    });
  }
  
  return days;
}

// Format booking period for display
export function formatPeriod(period: string): string {
  switch (period) {
    case "morning":
      return "صباحية";
    case "evening":
      return "مسائية";
    case "both":
      return "كامل اليوم";
    default:
      return period;
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-SA')} ﷼`;
}

// Get day background color based on bookings
export function getDayBackgroundColor(bookings: { morning?: any; evening?: any }) {
  if (bookings.morning && bookings.evening) {
    return "bg-green-100 hover:bg-green-50 border-green-300";
  } else if (bookings.morning || bookings.evening) {
    return "bg-blue-50 hover:bg-blue-50 border-blue-200";
  }
  return "bg-white hover:bg-gray-50 border-gray-200";
}

// Get period badge background color
export function getPeriodBadgeColor(period: string) {
  switch (period) {
    case "morning":
      return "bg-blue-100 text-blue-800";
    case "evening":
      return "bg-purple-100 text-purple-800";
    case "both":
      return "bg-green-200 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
