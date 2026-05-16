import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Solar, Lunar } from 'lunar-javascript';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function getLunarDate(date: Date) {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const month = lunar.getMonthInChinese();
  const day = lunar.getDayInChinese();
  return month + '月' + day;
}

export function formatHour(hour: number) {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  if (hour === 24) return '12:00 AM';
  return `${hour - 12}:00 PM`;
}

export function formatTimeRange(start: number, end: number) {
  return `${formatHour(start)} - ${formatHour(end)}`;
}
