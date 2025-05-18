import sensorModel, { SensorData } from '../models/sensorModel';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

class DataGeneratorService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private intervalSeconds = 30;
  private isGenerating = false; // Flag to prevent multiple simultaneous generations
  
  // Min/max values for random data generation
  private tempMin = 18;
  private tempMax = 30;
  private humidityMin = 45;
  private humidityMax = 70;
  
  // Keep track of the last values to make small incremental changes
  private lastTemp = 23;
  private lastHumidity = 55;
  
  /**
   * Generate a random sensor reading with realistic changes from previous values
   */
  private generateSensorReading(): SensorData {
    // Generate a small change from the last temperature (-1 to +1 degrees)
    const tempChange = (Math.random() * 2 - 1) * 0.5;
    // Generate a small change from the last humidity (-2 to +2 percent)
    const humidityChange = (Math.random() * 4 - 2);
    
    // Calculate new values with the small change
    let newTemp = this.lastTemp + tempChange;
    let newHumidity = this.lastHumidity + humidityChange;
    
    // Make sure values stay within the min/max range
    newTemp = Math.min(Math.max(newTemp, this.tempMin), this.tempMax);
    newHumidity = Math.min(Math.max(newHumidity, this.humidityMin), this.humidityMax);
    
    // Update the last values
    this.lastTemp = newTemp;
    this.lastHumidity = newHumidity;
    
    // Determine the prediction based on temperature and humidity
    let prediction: 'Normal' | 'Warning' | 'Alert' = 'Normal';
    if (newTemp > 27 || newHumidity > 65) {
      prediction = 'Warning';
    }
    if (newTemp > 28.5 || newHumidity > 68) {
      prediction = 'Alert';
    }
    
    const now = new Date();
    
    // Use Denmark timezone (Europe/Copenhagen)
    const timeZone = 'Europe/Copenhagen';
    const denmarkTime = toZonedTime(now, timeZone);
    
    // Create ISO timestamp string based on Denmark time
    const timestamp = formatInTimeZone(now, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    
    const sensorData = {
      temperature: Number(newTemp.toFixed(1)),
      humidity: Number(newHumidity.toFixed(1)),
      prediction,
      timestamp
    };
    
    return sensorData;
  }
  
  /**
   * Save a new sensor reading to the database
   */
  private async saveReading() {
    // Check if already generating data
    if (this.isGenerating) {
      return;
    }
    
    this.isGenerating = true;
    
    try {      
      // Generate random values
      const temperature = Math.round((22 + Math.random() * 12) * 10) / 10; // 22.0-33.9
      const humidity = Math.round((50 + Math.random() * 40) * 10) / 10; // 50.0-89.9
      
      // Calculate prediction based on temperature and humidity
      let prediction: 'Normal' | 'Warning' | 'Alert' = 'Normal';
      if (temperature > 30 || humidity > 80) {
        prediction = 'Warning';
      }
      if (temperature > 32 || humidity > 85) {
        prediction = 'Alert';
      }
      
      // Get current time in Denmark timezone
      const timeZone = 'Europe/Copenhagen';
      const zonedTime = toZonedTime(new Date(), timeZone);
      const timestamp = formatInTimeZone(zonedTime, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      
      // Create sensor data record
      const sensorData = {
        temperature,
        humidity,
        prediction,
        timestamp: timestamp
      };
      
      // Save to database
      try {
        await sensorModel.saveSensorData(sensorData);
      } catch (error) {
        // Database error - just swallow for now
      }
    } finally {
      this.isGenerating = false;
    }
  }
  
  /**
   * Start the data generator service
   */
  start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    // Generate data immediately on start
    this.saveReading();
    
    // Then set up an interval for regular data generation
    this.intervalId = setInterval(() => {
      this.saveReading();
    }, this.intervalSeconds * 1000);
  }
  
  /**
   * Stop the data generator service
   */
  stop() {
    if (!this.isRunning || !this.intervalId) {
      return;
    }
    
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
  }
  
  /**
   * Generate one reading on-demand
   */
  generateOnDemand() {
    this.saveReading();
  }
}

export default new DataGeneratorService();
