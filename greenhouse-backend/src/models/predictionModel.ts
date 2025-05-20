import pool from '../config/db';

// Interface that matches the exact database table structure
export interface PredictionData {
  id?: number;
  predicted_temp: number;
  predicted_air_humidity: number;
  predicted_soil_humidity: number;
  predicted_co2_level: number;
  predicted_light_lux: number;
  timestamp: string;
  created_at?: string;
}

class PredictionModel {
  // Ensure the prediction_datas table exists
  async ensureTableExists(): Promise<void> {
    try {
      
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS prediction_datas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          predicted_temp DECIMAL(5,2) NOT NULL,
          predicted_air_humidity DECIMAL(5,2) NOT NULL,
          predicted_soil_humidity DECIMAL(5,2) NOT NULL,
          predicted_co2_level DECIMAL(5,2) NOT NULL,
          predicted_light_lux DECIMAL(5,2) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_timestamp (timestamp),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      
    } catch (error) {
      console.error('Error ensuring prediction_datas table exists:', error);
      throw error;
    }
  }

  /**
   * Get prediction data for a specified time range
   */
  async getPredictions(hours = 24, limit = 500): Promise<PredictionData[]> {

    try {
      // Ensure table exists first
      await this.ensureTableExists();
      
      const now = new Date();
      
      // Format the current timestamp for comparison
      const nowFormatted = now.toISOString().slice(0, 19).replace('T', ' ');

      // Get all future predictions - no upper time limit
      const [rows] = await pool.query(
        `SELECT * FROM prediction_datas 
         WHERE timestamp >= ?
         ORDER BY timestamp ASC
         LIMIT ?`,
        [nowFormatted, limit]
      );
      
      return rows as PredictionData[];
    } catch (error) {
      console.error('Database error fetching predictions:', error);
      throw new Error(`Failed to fetch predictions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the most recent actual sensor data to base predictions on
   * or handle the case if the table doesn't exist
   */
  async ensureSensorTableAndGetLatest() {
    try {
      // Check if sensor_data table exists
      const [tables] = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'sensor_data'
      `);

      // If sensor_data table doesn't exist, create it with all necessary columns
      if (!(tables as any[]).length) {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS sensor_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            temperature DECIMAL(5,2) NOT NULL,
            air_humidity DECIMAL(5,2) NOT NULL, -- Assuming 'humidity' in old schema meant air_humidity
            soil_humidity DECIMAL(5,2) NOT NULL,
            co2_level DECIMAL(5,2) NOT NULL,
            light_lux DECIMAL(5,2) NOT NULL,
            prediction ENUM('Normal', 'Warning', 'Alert') DEFAULT 'Normal',
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_timestamp (timestamp)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        
      }
      
      // Get the most recent sensor data, including all new fields
      const [latestSensorDataRows] = await pool.query(
        `SELECT id, temperature, air_humidity, soil_humidity, co2_level, light_lux, prediction 
         FROM sensor_data 
         ORDER BY timestamp DESC 
         LIMIT 1`
      );
      
      return latestSensorDataRows as any[]; // Will be an array, potentially empty or with one row
    } catch (error) {
      console.error('Error ensuring/fetching from sensor_data table:', error);
      return []; // Return empty array on error, to be handled by caller
    }
  }

  /**
   * Generate and save prediction data
   */
  async generatePredictions(): Promise<number> {
    
    try {
      await this.ensureTableExists();
      
      const latestSensorDataRows = await this.ensureSensorTableAndGetLatest();
      
      let baseTemp = 23.5; // Default if no sensor data
      let baseAirHumidity = 55.0; // Default
      let baseSoilHumidity = 48.0; // Default
      let baseCO2Level = 800.0; // Default
      let baseLightLux = 1000.0; // Default

      if (latestSensorDataRows && latestSensorDataRows.length > 0) {
        const sensorData = latestSensorDataRows[0];
        baseTemp = parseFloat(sensorData.temperature) || baseTemp;
        baseAirHumidity = parseFloat(sensorData.air_humidity) || baseAirHumidity;
        baseSoilHumidity = parseFloat(sensorData.soil_humidity) || baseSoilHumidity;
        baseCO2Level = parseFloat(sensorData.co2_level) || baseCO2Level;
        baseLightLux = parseFloat(sensorData.light_lux) || baseLightLux;
      } else {
        // No actual sensor data, so we will use the defaults defined above
        // and the calculatePredictionPoint will rely on its internal logic if any base is still missing
        // (though we now provide all 5 defaults here).
        console.warn("No actual sensor data found. Generating predictions using default base values.");
      }
      
      await this.clearFuturePredictions();
            
      const now = new Date();
      now.setSeconds(0, 0);
      
      const batch: PredictionData[] = [];
      
      const currentPrediction = this.calculatePredictionPoint(
        baseTemp, baseAirHumidity, baseSoilHumidity, baseCO2Level, baseLightLux,
        now, 0, 0.1, 0.1
      );
      
      batch.push({
        ...currentPrediction,
        timestamp: now.toISOString().slice(0, 19).replace('T', ' ')
      });
      
      const shortTermHours = 12;
      const shortTermIntervals = shortTermHours * 4;
      
      for (let i = 1; i <= shortTermIntervals; i++) {
        const timestamp = new Date(now);
        const minutesOffset = i * 15;
        timestamp.setMinutes(timestamp.getMinutes() + minutesOffset);
        const hourOffset = minutesOffset / 60;
        const predictionPoint = this.calculatePredictionPoint(
          baseTemp, baseAirHumidity, baseSoilHumidity, baseCO2Level, baseLightLux,
          timestamp, hourOffset, 0.2, 1.5
        );
        batch.push({
          ...predictionPoint,
          timestamp: timestamp.toISOString().slice(0, 19).replace('T', ' ')
        });
      }
      
      const mediumTermDays = 30;
      const mediumTermIntervals = mediumTermDays * 24;
      const lastShortTermTime = new Date(now);
      lastShortTermTime.setMinutes(lastShortTermTime.getMinutes() + (shortTermIntervals * 15));
      
      for (let i = 0; i < mediumTermIntervals; i++) {
        const timestamp = new Date(lastShortTermTime);
        timestamp.setHours(timestamp.getHours() + i);
        const hourOffset = shortTermHours + i;
        const predictionPoint = this.calculatePredictionPoint(
          baseTemp, baseAirHumidity, baseSoilHumidity, baseCO2Level, baseLightLux,
          timestamp, hourOffset, 0.5, 3.0
        );
        batch.push({
          ...predictionPoint,
          timestamp: timestamp.toISOString().slice(0, 19).replace('T', ' ')
        });
      }
      
      return await this.savePredictionBatch(batch);
    } catch (error) {
      console.error('Error generating predictions:', error);
      // Attempt to generate with defaults as a fallback if the primary generation fails
      try {
        console.warn("Primary prediction generation failed. Attempting to generate with defaults.");
        return await this.generatePredictionsWithDefaults();
      } catch (defaultGenError) {
        console.error('Error generating predictions with defaults after primary failure:', defaultGenError);
        throw new Error(`Failed to generate predictions: ${error instanceof Error ? error.message : 'Unknown error'}. Default generation also failed: ${defaultGenError instanceof Error ? defaultGenError.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Calculate a single prediction data point using realistic patterns
   */
  private calculatePredictionPoint(
    baseTemp: number, 
    baseAirHumidity: number, 
    baseSoilHumidity: number,
    baseCO2Level: number,
    baseLightLux: number,
    timestamp: Date,
    hourOffset: number,
    randomFactor: number = 0.5,
    trendImpact: number = 3.0
  ): { predicted_temp: number; predicted_air_humidity: number; predicted_soil_humidity: number; predicted_co2_level: number; predicted_light_lux: number } {
    const hourOfDay = timestamp.getHours();
    const dayOfYear = Math.floor(
      (timestamp.getTime() - new Date(timestamp.getFullYear(), 0, 0).getTime()) / 
      (24 * 60 * 60 * 1000)
    );
    const dayNightCycle = Math.cos(((hourOfDay - 14) / 24) * 2 * Math.PI);
    const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.3;
    const dayNumber = Math.floor(hourOffset / 24);
    const weatherPatternCycle = Math.sin((dayNumber / 3) * Math.PI) * 0.7;
    const patternTransition = Math.sin((hourOffset / 72) * Math.PI) * trendImpact;
    
    const tempVariation = ((Math.random() * 2) - 1) * (0.2 * randomFactor);
    const airHumidityVariation = ((Math.random() * 2) - 1) * (0.4 * randomFactor);
    const soilHumidityVariation = ((Math.random() * 2) - 1) * (0.2 * randomFactor);
    const co2Variation = ((Math.random() * 2) - 1) * (0.3 * randomFactor);
    const lightLuxVariation = ((Math.random() * 2) - 1) * (0.5 * randomFactor);
    
    let predictedTemp = Number(baseTemp) +
                      (dayNightCycle * 2.5) +
                      (seasonalFactor * 0.5) +
                      (weatherPatternCycle * 0.8) +
                      (patternTransition * 0.4) +
                      tempVariation;
    
    let predictedAirHumidity = Number(baseAirHumidity) +
                             (dayNightCycle * -4.0) +
                             (seasonalFactor * 1.0) +
                             (weatherPatternCycle * 2.0) +
                             (patternTransition * -0.7) +
                             airHumidityVariation;
    
    let predictedSoilHumidity = Number(baseSoilHumidity) +
                              (dayNightCycle * -0.8) +
                              (seasonalFactor * 0.7) +
                              (weatherPatternCycle * 1.2) +
                              (patternTransition * -0.5) +
                              soilHumidityVariation;
    
    let predictedCO2Level = Number(baseCO2Level) + 
                          (dayNightCycle * -100) +
                          (seasonalFactor * 20) +
                          (weatherPatternCycle * 30) +
                          (patternTransition * 15) +
                          co2Variation * 50;
    
    let predictedLightLux;
    if (hourOfDay >= 22 || hourOfDay < 5) {
      predictedLightLux = 25 + (lightLuxVariation * 10);
    } else if (hourOfDay >= 5 && hourOfDay < 8) {
      const dawnProgress = (hourOfDay - 5) / 3;
      predictedLightLux = 25 + (dawnProgress * (Number(baseLightLux) * 0.8)) + (seasonalFactor * 50) + (lightLuxVariation * 30);
    } else if (hourOfDay >= 8 && hourOfDay < 17) {
      const midday = 12.5;
      const hoursFromMidday = Math.abs(hourOfDay - midday);
      const middayFactor = 1 - (hoursFromMidday / 4.5) * 0.3;
      predictedLightLux = Number(baseLightLux) * middayFactor +
                         (seasonalFactor * 100) +
                         (weatherPatternCycle * 150) +
                         (lightLuxVariation * 50);
    } else {
      const duskProgress = (hourOfDay - 17) / 5;
      const duskFactor = 1 - duskProgress;
      predictedLightLux = 25 + (duskFactor * (Number(baseLightLux) * 0.8)) + (seasonalFactor * 50) + (lightLuxVariation * 30);
    }
    
    predictedTemp = Math.max(18, Math.min(30, predictedTemp));
    predictedAirHumidity = Math.max(40, Math.min(80, predictedAirHumidity));
    predictedSoilHumidity = Math.max(35, Math.min(70, predictedSoilHumidity));
    predictedCO2Level = Math.max(400, Math.min(1500, predictedCO2Level));
    predictedLightLux = Math.max(0, Math.min(2000, predictedLightLux));
    
    return {
      predicted_temp: parseFloat(predictedTemp.toFixed(1)),
      predicted_air_humidity: parseFloat(predictedAirHumidity.toFixed(1)),
      predicted_soil_humidity: parseFloat(predictedSoilHumidity.toFixed(1)),
      predicted_co2_level: parseFloat(predictedCO2Level.toFixed(1)),
      predicted_light_lux: parseFloat(predictedLightLux.toFixed(1))
    };
  }

  /**
   * Generate predictions with default values when no sensor data is available
   */
  async generatePredictionsWithDefaults(): Promise<number> {
    
    const baseTemp = 23.5;
    const baseAirHumidity = 55.0;
    const baseSoilHumidity = 48.0;
    const baseCO2Level = 800.0; // Default base CO2 for defaults
    const baseLightLux = 1000.0; // Default base Light for defaults
    
    await this.clearFuturePredictions(); // Clear future predictions before generating new defaults

    const now = new Date();
    now.setSeconds(0,0); // Normalize time
    const batch: PredictionData[] = [];
    
    // Current prediction point for defaults
    const currentDefaultPrediction = this.calculatePredictionPoint(
      baseTemp, baseAirHumidity, baseSoilHumidity, baseCO2Level, baseLightLux,
      now, 0, 0.1, 0.1
    );
    batch.push({
      ...currentDefaultPrediction,
      timestamp: now.toISOString().slice(0, 19).replace('T', ' ')
    });

    const shortTermHours = 12;
    const shortTermIntervals = shortTermHours * 4;
    
    for (let i = 1; i <= shortTermIntervals; i++) { // Start from 1
      const timestamp = new Date(now);
      const minutesOffset = i * 15;
      timestamp.setMinutes(timestamp.getMinutes() + minutesOffset);
      const hourOffset = minutesOffset / 60;
      const predictionPoint = this.calculatePredictionPoint(
        baseTemp, baseAirHumidity, baseSoilHumidity, baseCO2Level, baseLightLux, 
        timestamp, hourOffset, 0.2, 1.5 
      );
      batch.push({
        ...predictionPoint,
        timestamp: timestamp.toISOString().slice(0, 19).replace('T', ' ')
      });
    }
    
    const mediumTermDays = 30;
    const mediumTermIntervals = mediumTermDays * 24;
    const lastShortTermTime = new Date(now);
    lastShortTermTime.setMinutes(lastShortTermTime.getMinutes() + (shortTermIntervals * 15));
    
    for (let i = 0; i < mediumTermIntervals; i++) {
      const timestamp = new Date(lastShortTermTime);
      timestamp.setHours(timestamp.getHours() + i);
      const hourOffset = shortTermHours + i;
      const predictionPoint = this.calculatePredictionPoint(
        baseTemp, baseAirHumidity, baseSoilHumidity, baseCO2Level, baseLightLux,
        timestamp, hourOffset, 0.5, 3.0
      );
      batch.push({
        ...predictionPoint,
        timestamp: timestamp.toISOString().slice(0, 19).replace('T', ' ')
      });
    }
    
    return await this.savePredictionBatch(batch);
  }

  /**
   * Save a batch of prediction data records
   */
  async savePredictionBatch(predictions: PredictionData[]): Promise<number> {
    if (!predictions.length) return 0;
    
    try {
      
      // First ensure the table exists
      await this.ensureTableExists();
      
      // For debugging, print the SQL query we're about to run
      const values = predictions.map(p => [
        p.predicted_temp,
        p.predicted_air_humidity,
        p.predicted_soil_humidity,
        p.predicted_co2_level,
        p.predicted_light_lux,
        p.timestamp // Already formatted for MySQL
      ]);
      
      
      // Execute the batch insert
      const [result] = await pool.query(
        `INSERT INTO prediction_datas 
         (predicted_temp, predicted_air_humidity, predicted_soil_humidity, predicted_co2_level, predicted_light_lux, timestamp) 
         VALUES ?`,
        [values]
      );
      
      return (result as any).affectedRows;
    } catch (error) {
      console.error('Error saving prediction batch:', error);
      throw new Error(`Failed to save predictions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save a single prediction data record (for testing)
   */
  async saveSinglePrediction(data: PredictionData): Promise<number> {
    try {
      
      // Ensure table exists
      await this.ensureTableExists();
      
      const [result] = await pool.query(
        `INSERT INTO prediction_datas 
         (predicted_temp, predicted_air_humidity, predicted_soil_humidity, predicted_co2_level, predicted_light_lux, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.predicted_temp,
          data.predicted_air_humidity,
          data.predicted_soil_humidity,
          data.predicted_co2_level,
          data.predicted_light_lux,
          data.timestamp
        ]
      );
      
      return (result as any).insertId;
    } catch (error) {
      console.error('Error saving single prediction:', error);
      throw error;
    }
  }

  /**
   * Clear all predictions for future timestamps
   */
  async clearFuturePredictions(): Promise<void> {
    try {
      const now = new Date();
      const nowFormatted = now.toISOString().slice(0, 19).replace('T', ' ');
      
      const [result] = await pool.query(
        `DELETE FROM prediction_datas 
         WHERE timestamp > ?`,
        [nowFormatted]
      );
      
    } catch (error) {
      console.error('Error clearing future predictions:', error);
    }
  }

  /**
   * Clear all prediction data
   */
  async clearAllPredictions(): Promise<void> {
    try {
      const [result] = await pool.query('TRUNCATE TABLE prediction_datas');
    } catch (error) {
    }
  }
}

export default new PredictionModel(); 