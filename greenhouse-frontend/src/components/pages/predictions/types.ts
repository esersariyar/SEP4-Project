export interface PredictionData {
  id?: number;
  predicted_temp: number;
  predicted_air_humidity: number;
  predicted_soil_humidity: number;
  predicted_co2_level: number;
  predicted_light_lux: number;
  timestamp: string;
  parsedDate?: Date; // Kept as it might be useful for components consuming processed data
  ms?: number;       // Kept for the same reason
}

export interface Range {
  min: number;
  max: number;
  ideal: { min: number; max: number };
}

export interface Ranges {
  temp: Range;
  air_humidity: Range;
  soil_humidity: Range;
  co2_level: Range;
  light_lux: Range;
}

export interface TimeRangeOption {
  value: string;
  label: string;
}

export interface SensorType {
  id: string;
  label: string;
  unit: string;
  color: string;
}

export interface Insight {
  type: 'warning' | 'success';
  icon: string;
  message: string;
  sensor: string;
}

// For data processed for the chart
export interface ChartDataItem {
  timestamp: string;
  date?: Date;
  [key: string]: any; // For dynamic sensor keys
} 