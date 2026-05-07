import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";

export function formatMessageTime(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  
  if (isYesterday(date)) {
    return "Yesterday";
  }
  
  return format(date, "MMM d");
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "";
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
