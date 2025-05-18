/**
 * Utility functions for chart components
 */

/**
 * Filter valid data for charts, ensuring timestamps are valid dates
 * @param data Array of data objects
 * @param xAxisKey Key name for the timestamp in data objects
 * @returns Filtered array with valid dates only
 */
export const filterValidChartData = (data: any[], xAxisKey: string): any[] => {
  return data.filter(item => {
    try {
      if (!item[xAxisKey]) return false;
      const date = new Date(item[xAxisKey]);
      return !isNaN(date.getTime());
    } catch (e) {
      return false;
    }
  });
};

/**
 * Format a date for chart axis ticks
 * @param value Date string
 * @param timeRange Optional time range for custom formatting
 * @returns Formatted date string
 */
export const formatChartTick = (value: string, timeRange?: string): string => {
  if (!value) return '';
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format based on time range if provided
    if (timeRange) {
      if (['1h', '6h', '12h', '24h'].includes(timeRange)) {
        // For shorter ranges, just show time
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else {
        // For longer ranges (3d, 7d, 30d), show date and time
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
    }
    
    // Default format if no timeRange provided
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

/**
 * Calculate appropriate interval for X-axis ticks based on data length and time range
 * @param dataLength Number of data points
 * @param timeRange Time range string (e.g. '24h', '7d')
 * @returns Number representing interval between ticks
 */
export const calculateTickInterval = (dataLength: number, timeRange: string): number => {
  // Adjust intervals based on time range to avoid overcrowding
  if (timeRange === '1h') {
    return Math.max(1, Math.floor(dataLength / 6)); // Show ~6 ticks for 1h
  } else if (timeRange === '6h') {
    return Math.max(1, Math.floor(dataLength / 6)); // Show ~6 ticks for 6h
  } else if (timeRange === '12h') {
    return Math.max(1, Math.floor(dataLength / 8)); // Show ~8 ticks for 12h
  } else if (timeRange === '24h') {
    return Math.max(1, Math.floor(dataLength / 8)); // Show ~8 ticks for 24h
  } else if (timeRange === '7d') {
    return Math.max(1, Math.floor(dataLength / 10)); // Show ~10 ticks for 7d
  } else if (timeRange === '30d') {
    return Math.max(1, Math.floor(dataLength / 12)); // Show ~12 ticks for 30d
  }
  
  // Default fallback based on data length
  if (dataLength <= 12) return 1;
  if (dataLength <= 24) return 3;
  if (dataLength <= 48) return 6;
  if (dataLength <= 96) return 12;
  return 24;
}; 