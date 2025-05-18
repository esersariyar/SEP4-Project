/**
 * Utility functions for formatting data in components
 */

/**
 * Format a timestamp in "time ago" format
 * @param seconds Number of seconds elapsed
 * @returns Formatted string (e.g. "2 minutes ago")
 */
export const formatTimeAgo = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Format a date to a readable string
 * @param timestamp ISO string or Date object
 * @returns Formatted date and time string
 */
export const formatDateTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Ensure a value is a number type
 * @param value String or number value
 * @returns Number value
 */
export const ensureNumber = (value: string | number): number => {
  if (typeof value === 'string') {
    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }
  return value;
}; 