import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Solar, Lunar } from 'lunar-javascript';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals?: number) {
  if (isNaN(num) || num === undefined || num === null) return "0";
  const rounded = Math.round(num * 100) / 100;
  const d = (rounded % 1 === 0) ? 0 : (decimals !== undefined ? decimals : 2);
  if (d === 0) {
    const parts = Math.round(rounded).toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts[0];
  }
  const parts = rounded.toFixed(d).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function getLunarDate(date: Date) {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const month = lunar.getMonthInChinese();
  const day = lunar.getDayInChinese();
  return month + '月' + day;
}

export function formatHour(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour % 1) * 60);
  const mm = m === 0 ? '00' : m.toString().padStart(2, '0');
  
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const ampm = (h % 24) < 12 ? 'AM' : 'PM';
  
  return `${displayH}:${mm} ${ampm}`;
}

export function formatTimeRange(start: number, end: number) {
  return `${formatHour(start)} - ${formatHour(end)}`;
}
