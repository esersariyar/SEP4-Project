/**
 * Utility functions for generating demo/mock data
 */

export interface SensorData {
  id?: number;
  temperature: number | string;
  humidity: number | string;
  prediction: 'Normal' | 'Alert' | 'Warning';
  timestamp: string;
  _source?: string;
  _highlight?: 'temperature' | 'humidity' | 'both';
}

/**
 * Generate a single sensor data point for demonstration
 * @returns Sensor data object with current timestamp
 */
export const generateDemoDataPoint = (): SensorData => {
  const now = new Date();
  const id = Math.floor(Math.random() * 1000);
  
  const temperature = (20 + Math.random() * 10).toFixed(1);
  const humidity = (50 + Math.random() * 30).toFixed(1);
  
  let prediction: 'Normal' | 'Alert' | 'Warning' = 'Normal';
  if (parseFloat(temperature) > 28) prediction = 'Alert';
  else if (parseFloat(temperature) > 25) prediction = 'Warning';
  
  return {
    id,
    temperature,
    humidity,
    prediction,
    timestamp: now.toISOString(),
    _source: 'demo'
  };
};

/**
 * Generate historical sensor data for charts
 * @param range Time range in format '1h', '24h', '7d', etc.
 * @returns Array of sensor data points
 */
export const generateDemoHistoricalData = (range: string = '24h'): SensorData[] => {
  const now = new Date();
  const data: SensorData[] = [];
  
  let hours = 24;
  if (range === '1h') hours = 1;
  else if (range === '6h') hours = 6;
  else if (range === '12h') hours = 12;
  else if (range === '7d') hours = 168;  
  else if (range === '30d') hours = 720; 
  
  const interval = (hours * 60 * 60) / 100;  
  
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(now.getTime() - ((99 - i) * interval * 1000));
    
    const hourOfDay = timestamp.getHours();
    const baseTemperature = 18 + (hourOfDay > 6 && hourOfDay < 18 ? 7 : 2); 
    const temperature = (baseTemperature + Math.random() * 5).toFixed(1);
    
    const baseHumidity = 55 + (hourOfDay > 6 && hourOfDay < 18 ? -5 : 10); 
    const humidity = (baseHumidity + Math.random() * 10).toFixed(1);
    
    let prediction: 'Normal' | 'Alert' | 'Warning' = 'Normal';
    if (parseFloat(temperature) > 28) prediction = 'Alert';
    else if (parseFloat(temperature) > 25) prediction = 'Warning';
    
    data.push({
      id: i,
      temperature,
      humidity,
      prediction,
      timestamp: timestamp.toISOString(),
      _source: 'demo'
    });
  }
  
  return data;
};

/**
 * Generate prediction data with realistic patterns
 * @param hours Number of hours to generate data for
 * @returns Array of prediction data points
 */
export const generateLocalMockData = (hours = 24): SensorData[] => {
  const data: SensorData[] = [];
  const now = new Date();
  
  // Create realistic base values
  const baseTemp = 22.5 + (Math.random() * 1.5); // Range: 22.5-24°C
  const baseHumidity = 53.0 + (Math.random() * 3.0); // Range: 53-56%
  
  // Create realistic variations
  // Day-night cycle (approx 2°C difference)
  const dayTemp = baseTemp + 1.0;
  const nightTemp = baseTemp - 1.0;
  
  // Day-night humidity (inverse to temperature, 5-8% difference)
  const dayHumidity = baseHumidity - 3.0;
  const nightHumidity = baseHumidity + 5.0;
  
  // Generate data points at 30-minute intervals for more natural curves
  const interval = hours <= 6 ? 0.25 : hours <= 24 ? 0.5 : 1; // 15min, 30min or 1hr intervals
  const dataPoints = Math.ceil(hours / interval);
  
  // Get the current hour for day/night cycle alignment
  const currentHour = now.getHours();
  
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(now.getTime() - (hours * 3600000) + (i * interval * 3600000));
    const hour = timestamp.getHours();
    const isDaytime = hour >= 6 && hour < 18;
    
    // Calculate temperature with day/night cycle and small random variations
    const tempBase = isDaytime ? dayTemp : nightTemp;
    const tempVariation = (Math.sin(i / (dataPoints / 8) * Math.PI) * 0.5) + (Math.random() * 0.5 - 0.25);
    const temperature = (tempBase + tempVariation).toFixed(1);
    
    // Calculate humidity with day/night cycle (inverse to temperature) and random variations
    const humidityBase = isDaytime ? dayHumidity : nightHumidity;
    const humidityVariation = (Math.sin(i / (dataPoints / 6) * Math.PI) * 2) + (Math.random() * 2 - 1);
    const humidity = (humidityBase + humidityVariation).toFixed(1);
    
    // Determine prediction based on temperature
    let prediction: 'Normal' | 'Alert' | 'Warning' = 'Normal';
    if (parseFloat(temperature) > 28) prediction = 'Alert';
    else if (parseFloat(temperature) > 25) prediction = 'Warning';
    
    data.push({
      temperature,
      humidity,
      prediction,
      timestamp: timestamp.toISOString(),
      _source: 'demo'
    });
  }
  
  return data;
}; 