import { Request, Response } from 'express';
import sensorModel, { SensorData } from '../models/sensorModel';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

// Denmark timezone
const DENMARK_TIMEZONE = 'Europe/Copenhagen';

/**
 * Returns the current time in ISO format for Denmark timezone
 */
const getCurrentDenmarkTimeISOString = (): string => {
  const now = new Date();
  return formatInTimeZone(now, DENMARK_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
};

const mockCurrentData: SensorData = {
  id: 1,
  temperature: 24.5,
  air_humidity: 56.8,
  soil_humidity: 45.2,
  co2_level: 450.0,
  timestamp: getCurrentDenmarkTimeISOString()
};

const generateMockHistoricalData = (hours = 24): SensorData[] => {
  const data: SensorData[] = [];
  const now = new Date();
  
  // Create multiple data points per hour
  // This ensures we have multiple points when "Last 1 Hour" is selected
  const dataPointsPerHour = 5; // 5 data points per hour
  const totalPoints = hours * dataPointsPerHour;
  
  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date(now);
    // Calculate more precise time intervals (minutes)
    const minutesAgo = (totalPoints - 1 - i) * (60 / dataPointsPerHour);
    timestamp.setMinutes(now.getMinutes() - minutesAgo);
    
    // Denmark timezone conversion
    const denmarkTimestamp = formatInTimeZone(
      timestamp, 
      DENMARK_TIMEZONE, 
      "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    );
    
    const temp = 20 + Math.random() * 10;
    const airHumidity = 45 + Math.random() * 25;
    
    data.push({
      id: i + 1,
      temperature: temp,
      air_humidity: airHumidity,
      soil_humidity: airHumidity * 0.9 + (Math.random() * 10 - 5),
      co2_level: 400 + (temp - 20) * 15 + (Math.random() * 50 - 25),
      timestamp: denmarkTimestamp
    });
  }
  
  return data;
};


function downsampleData(data: SensorData[], targetCount: number): SensorData[] {
  if (data.length <= targetCount) {
    return data;
  }
  
  const result: SensorData[] = [];
  const step = data.length / targetCount;
  
  for (let i = 0; i < targetCount; i++) {
    const index = Math.min(Math.floor(i * step), data.length - 1);
    result.push(data[index]);
  }
  

  if (result[result.length - 1] !== data[data.length - 1]) {
    result[result.length - 1] = data[data.length - 1];
  }
  
  return result;
}

class SensorController {

  async getCurrentData(req: Request, res: Response) {
    try {
      let sensorData: SensorData;
      
      try {
        sensorData = await sensorModel.getCurrentData();
        
        if (!sensorData) {
          return res.status(404).json({ message: 'Veritabanında hiç veri bulunamadı' });
        }
        
        res.status(200).json(sensorData);
      } catch (dbError) {
        console.error('Veritabanı hatası:', dbError);
        res.status(500).json({ message: 'Veritabanı bağlantısında hata oluştu' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Sensor verisi alınırken sunucu hatası oluştu' });
    }
  }


  async getHistoricalData(req: Request, res: Response) {
    try {
      const range = (req.query.range as string) || '24h';
      const limit = parseInt(req.query.limit as string) || 100;
      
      // Get data from model
      const sensorData = await sensorModel.getHistoricalData(24, limit);
      
      if (sensorData && sensorData.length > 0) {
        console.log('Controller - Veri durumu:', {
          toplamKayit: sensorData.length,
          enYeniKayit: sensorData[sensorData.length - 1]?.timestamp,
          enEskiKayit: sensorData[0]?.timestamp
        });

        // Eğer veri sayısı limiti aşıyorsa örnekleme yap
        let finalData = sensorData;
        if (sensorData.length > limit) {
          finalData = downsampleData(sensorData, limit);
        }

        res.status(200).json({ 
          data: finalData,
          range,
          count: finalData.length
        });
      } else {
        res.status(404).json({ message: 'Bu sensör için veri bulunamadı' });
      }
    } catch (error) {
      console.error('Geçmiş veri çekerken hata:', error);
      res.status(500).json({ message: 'Geçmiş veri çekerken sunucu hatası' });
    }
  }


  async createSensorData(req: Request, res: Response) {
    try {
      const sensorData: SensorData = req.body;
      let insertId: number;
      let source = 'database';
      
      try {
        insertId = await sensorModel.saveSensorData(sensorData);
      } catch (dbError) {
        source = 'mock';
        insertId = Math.floor(Math.random() * 1000);
      }
      

      res.status(201).json({ 
        id: insertId, 
        ...sensorData,
        _source: source
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error saving sensor data' });
    }
  }

  async generateDemoData(req: Request, res: Response) {
    try {
      // Clear existing data first
      await sensorModel.clearAllData();

      const daysToGenerate = 30;
      const intervalSeconds = 30;
      const totalRecords = (daysToGenerate * 24 * 60 * 60) / intervalSeconds;
      
      // Start from 30 days ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToGenerate);
      startDate.setFullYear(2023); // Force year to be 2023
      
      // Initialize with reasonable values
      let currentTemp = 23.5;
      let currentAirHumidity = 55.0;
      let currentSoilHumidity = 50.0;
      let currentCO2Level = 450.0;
      let recordsGenerated = 0;
      
      // Create a batch insert function to improve performance
      const batchSize = 1000;
      let batch: SensorData[] = [];
      
      // Generate data points
      for (let i = 0; i < totalRecords; i++) {
        // Calculate timestamp for this record
        const timestamp = new Date(startDate.getTime() + (i * intervalSeconds * 1000));
        
        // Add some variability to temperature and humidity
        // More realistic changes: daily cycles, weekly patterns
        
        // Daily cycle: temperatures higher during day, lower at night
        const hourOfDay = timestamp.getHours();
        const dayFactor = Math.sin((hourOfDay - 6) * Math.PI / 12); // Peak at noon, lowest at midnight
        
        // Weekly pattern: slightly warmer on weekends
        const dayOfWeek = timestamp.getDay(); // 0 = Sunday, 6 = Saturday
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.5 : 0;
        
        // Random variation
        const tempChange = (Math.random() * 2 - 1) * 0.3; // Small random fluctuation
        const airHumidityChange = (Math.random() * 4 - 2) * 0.5; // Larger fluctuation for humidity
        
        // Calculate new values
        currentTemp += tempChange + (dayFactor * 1.5) + (weekendFactor * 0.5);
        currentAirHumidity += airHumidityChange - (dayFactor * 0.8); // Humidity tends to be inverse of temperature
        
        // Keep values within realistic bounds
        currentTemp = Math.min(Math.max(currentTemp, 18), 30);
        currentAirHumidity = Math.min(Math.max(currentAirHumidity, 45), 70);
        
        // Calculate soil humidity (related to air humidity but changes more slowly)
        currentSoilHumidity = currentSoilHumidity * 0.95 + currentAirHumidity * 0.05 + (Math.random() * 2 - 1);
        currentSoilHumidity = Math.min(Math.max(currentSoilHumidity, 40), 80);
        
        // Calculate CO2 level (related to temperature)
        currentCO2Level = 400 + (currentTemp - 20) * 15 + (Math.random() * 30 - 15);
        currentCO2Level = Math.min(Math.max(currentCO2Level, 350), 800);
        
        // Create the sensor data record
        const sensorData: SensorData = {
          temperature: Number(currentTemp.toFixed(1)),
          air_humidity: Number(currentAirHumidity.toFixed(1)),
          soil_humidity: Number(currentSoilHumidity.toFixed(1)),
          co2_level: Number(currentCO2Level.toFixed(1)),
          timestamp: timestamp.toISOString()
        };
        
        batch.push(sensorData);
        
        // Save batch when it reaches the batch size
        if (batch.length >= batchSize) {
          await sensorModel.saveSensorDataBatch(batch);
          recordsGenerated += batch.length;
          batch = [];
        }
      }
      
      // Save any remaining records
      if (batch.length > 0) {
        await sensorModel.saveSensorDataBatch(batch);
        recordsGenerated += batch.length;
      }
      
      res.status(200).json({
        success: true,
        message: `Successfully generated ${recordsGenerated} demo records spanning ${daysToGenerate} days`
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Server error generating demo data' 
      });
    }
  }
}

export default new SensorController();
