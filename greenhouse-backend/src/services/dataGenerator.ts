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
    
    // Generate soil humidity and CO2 levels (related to air conditions)
    const soilHumidity = Math.min(Math.max(newHumidity * 0.9 + (Math.random() * 10 - 5), 30), 90);
    const co2Level = 400 + Math.round((newTemp - 20) * 15 + (Math.random() * 50 - 25));
    
    const now = new Date();
    
    // Use Denmark timezone (Europe/Copenhagen)
    const timeZone = 'Europe/Copenhagen';
    const denmarkTime = toZonedTime(now, timeZone);
    const currentHour = denmarkTime.getHours();
    const currentMinute = denmarkTime.getMinutes();
    
    // Günün saatini 0-1 arasında normalize et (0:00 = 0, 12:00 = 1, 23:59 = 0.999)
    const normalizedHour = (currentHour + currentMinute / 60) / 24;
    
    // Gün doğumu ve batımı için yumuşak geçiş faktörü (6:00-8:00 ve 16:00-18:00 arası)
    let dayFactor = 0;
    if (currentHour >= 6 && currentHour < 8) {
      // Gün doğumu (6:00-8:00)
      dayFactor = (currentHour - 6 + currentMinute / 60) / 2;
    } else if (currentHour >= 16 && currentHour < 18) {
      // Gün batımı (16:00-18:00)
      dayFactor = 1 - (currentHour - 16 + currentMinute / 60) / 2;
    } else if (currentHour >= 8 && currentHour < 16) {
      // Tam gündüz
      dayFactor = 1;
    } else {
      // Gece (minimum ışık)
      dayFactor = 0.1;
    }
    
    // Işık seviyesi hesaplama
    let lightLux;
    if (dayFactor > 0.1) {
      // Gündüz veya geçiş zamanı
      const baseLight = 2000; // Minimum gündüz ışığı
      const maxLight = 10000; // Maksimum gündüz ışığı
      const variation = Math.sin(normalizedHour * Math.PI * 2) * 1000; // Gün içi dalgalanma
      lightLux = Math.round((baseLight + (maxLight - baseLight) * dayFactor + variation) * 10) / 10;
    } else {
      // Gece (LED ışıklar)
      const baseNightLight = 500; // Minimum gece ışığı
      const maxNightLight = 1000; // Maksimum gece ışığı
      lightLux = Math.round((baseNightLight + Math.random() * (maxNightLight - baseNightLight)) * 10) / 10;
    }
    
    console.log(`[${new Date().toISOString()}] Işık seviyesi hesaplaması:`, {
      currentHour,
      currentMinute,
      normalizedHour,
      dayFactor,
      lightLux,
      isDaytime: dayFactor > 0.1
    });
    
    // Create ISO timestamp string based on Denmark time
    const timestamp = formatInTimeZone(now, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    
    const sensorData = {
      temperature: Number(newTemp.toFixed(1)),
      air_humidity: Number(newHumidity.toFixed(1)),
      soil_humidity: Number(soilHumidity.toFixed(1)),
      co2_level: Number(co2Level.toFixed(1)),
      light_lux: lightLux,
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
      // Get current time in Denmark timezone
      const timeZone = 'Europe/Copenhagen';
      const now = new Date();
      const zonedTime = toZonedTime(now, timeZone);
      const currentHour = zonedTime.getHours();
      const currentMinute = zonedTime.getMinutes();
      
      // Günün saatini 0-1 arasında normalize et
      const normalizedHour = (currentHour + currentMinute / 60) / 24;
      
      // Gün doğumu ve batımı için yumuşak geçiş faktörü
      let dayFactor = 0;
      if (currentHour >= 6 && currentHour < 8) {
        // Gün doğumu (6:00-8:00)
        dayFactor = (currentHour - 6 + currentMinute / 60) / 2;
      } else if (currentHour >= 16 && currentHour < 18) {
        // Gün batımı (16:00-18:00)
        dayFactor = 1 - (currentHour - 16 + currentMinute / 60) / 2;
      } else if (currentHour >= 8 && currentHour < 16) {
        // Tam gündüz
        dayFactor = 1;
      } else {
        // Gece (minimum ışık)
        dayFactor = 0.1;
      }
      
      // Işık seviyesi hesaplama
      let lightLux;
      if (dayFactor > 0.1) {
        // Gündüz veya geçiş zamanı
        const baseLight = 2000; // Minimum gündüz ışığı
        const maxLight = 10000; // Maksimum gündüz ışığı
        const variation = Math.sin(normalizedHour * Math.PI * 2) * 1000; // Gün içi dalgalanma
        lightLux = Math.round((baseLight + (maxLight - baseLight) * dayFactor + variation) * 10) / 10;
      } else {
        // Gece (LED ışıklar)
        const baseNightLight = 500; // Minimum gece ışığı
        const maxNightLight = 1000; // Maksimum gece ışığı
        lightLux = Math.round((baseNightLight + Math.random() * (maxNightLight - baseNightLight)) * 10) / 10;
      }
      
      console.log(`[${new Date().toISOString()}] Işık seviyesi hesaplaması:`, {
        currentHour,
        currentMinute,
        normalizedHour,
        dayFactor,
        lightLux,
        isDaytime: dayFactor > 0.1
      });
      
      // Diğer sensör değerlerini hesapla
      let tempBase, tempVariation, airHumidityBase, airHumidityVariation;
      
      if (currentHour >= 6 && currentHour <= 10) {
        tempBase = 21 + (currentHour - 6) * 0.5;
        tempVariation = 1.5;
        airHumidityBase = 60;
        airHumidityVariation = 5;
      } else if (currentHour >= 11 && currentHour <= 17) {
        tempBase = 24 + (currentHour - 11) * 0.3;
        tempVariation = 2;
        airHumidityBase = 55;
        airHumidityVariation = 7;
      } else if (currentHour >= 18 && currentHour <= 22) {
        tempBase = 25 - (currentHour - 18) * 0.7;
        tempVariation = 1.5;
        airHumidityBase = 58;
        airHumidityVariation = 6;
      } else {
        tempBase = 20;
        tempVariation = 1;
        airHumidityBase = 62;
        airHumidityVariation = 4;
      }
      
      const temperature = Math.round((tempBase + (Math.random() * 2 - 1) * tempVariation) * 10) / 10;
      const airHumidity = Math.round((airHumidityBase + (Math.random() * 2 - 1) * airHumidityVariation) * 10) / 10;
      const soilHumidity = Math.round((airHumidity * 0.9 + (Math.random() * 10 - 5)) * 10) / 10;
      const co2Level = Math.round((400 + (temperature - 20) * 15 + (Math.random() * 50 - 25)) * 10) / 10;
      
      const timestamp = formatInTimeZone(zonedTime, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      
      // Create sensor data record
      const sensorData = {
        temperature,
        air_humidity: airHumidity,
        soil_humidity: soilHumidity,
        co2_level: co2Level,
        light_lux: lightLux,
        timestamp: timestamp
      };
      
      console.log(`[${new Date().toISOString()}] Veri üretildi:`, {
        temperature: `${temperature}°C`,
        airHumidity: `${airHumidity}%`,
        soilHumidity: `${soilHumidity}%`,
        co2Level: `${co2Level}ppm`,
        lightLux: `${lightLux}lux`,
        timestamp,
        currentHour,
        timeZone
      });
      
      // Save to database
      try {
        const insertId = await sensorModel.saveSensorData(sensorData);
        console.log(`[${new Date().toISOString()}] Data successfully saved to database! ID: ${insertId}`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR: Failed to save data to database!`, error);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR: Unexpected error in data generation!`, error);
    } finally {
      this.isGenerating = false;
    }
  }
  
  /**
   * Start the data generator service
   */
  start() {
    if (this.isRunning) {
      console.log(`[${new Date().toISOString()}] Data generator service is already running.`);
      return;
    }
    
    this.isRunning = true;
    console.log(`[${new Date().toISOString()}] Data generator service started! Will generate data every ${this.intervalSeconds} seconds.`);
    
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
      console.log(`[${new Date().toISOString()}] Data generator service is already stopped.`);
      return;
    }
    
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    console.log(`[${new Date().toISOString()}] Data generator service stopped.`);
  }
  
  /**
   * Generate one reading on-demand
   */
  generateOnDemand() {
    this.saveReading();
  }
}

export default new DataGeneratorService();
