import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { faIR } from "date-fns/locale";

export function relativeTime(ts: number): string {
  const d = new Date(ts);
  if (isToday(d)) {
    return formatDistanceToNow(d, { addSuffix: true, locale: faIR });
  }
  if (isYesterday(d)) {
    return "دیروز";
  }
  return format(d, "d MMM yyyy", { locale: faIR });
}

export function fullDate(ts: number): string {
  return format(new Date(ts), "yyyy/MM/dd HH:mm", { locale: faIR });
}
