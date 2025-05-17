import pool from '../config/db';

// Interface that matches the exact database table structure
export interface PredictionData {
  id?: number;
  predicted_temp: number;
  predicted_air_humidity: number;
  predicted_soil_humidity: number;
  timestamp: string;
  created_at?: string;
}

class PredictionModel {
  // Ensure the prediction_datas table exists
  async ensureTableExists(): Promise<void> {
    try {
      console.log('Checking if prediction_datas table exists...');
      
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS prediction_datas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          predicted_temp DECIMAL(5,2) NOT NULL,
          predicted_air_humidity DECIMAL(5,2) NOT NULL,
          predicted_soil_humidity DECIMAL(5,2) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_timestamp (timestamp),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      
      console.log('Table prediction_datas exists or was created');
    } catch (error) {
      console.error('Error ensuring prediction_datas table exists:', error);
      throw error;
    }
  }

  /**
   * Get prediction data for a specified time range
   */
  async getPredictions(hours = 24, limit = 500): Promise<PredictionData[]> {
    console.log(`Fetching prediction data for next ${hours} hours, limit: ${limit}`);

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
      
      console.log(`Retrieved ${(rows as any[]).length} prediction records`);
      return rows as PredictionData[];
    } catch (error) {
      console.error('Database error fetching predictions:', error);
      throw new Error(`Failed to fetch predictions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate and save prediction data
   */
  async generatePredictions(): Promise<number> {
    console.log('Generating new prediction data...');
    
    try {
      // Ensure table exists first
      await this.ensureTableExists();
      
      // First, clear existing predictions for future timestamps
      await this.clearFuturePredictions();
      
      // Get the most recent actual sensor data to base predictions on
      const [latestSensorData] = await pool.query(
        `SELECT id, temperature, humidity, prediction 
         FROM sensor_data 
         ORDER BY timestamp DESC 
         LIMIT 1`
      );
      
      if (!(latestSensorData as any[]).length) {
        console.log('No sensor data found to base predictions on, using default values');
        // Use default values if no sensor data is available
        return this.generatePredictionsWithDefaults();
      }
      
      const sensorData = (latestSensorData as any[])[0];
      const baseTemp = parseFloat(sensorData.temperature) || 24.0;
      const baseAirHumidity = parseFloat(sensorData.humidity) || 55.0;
      const baseSoilHumidity = 50.0; // Starting base for soil humidity (if not in actual data)
      
      console.log(`Base values: Temp=${baseTemp}, AirHum=${baseAirHumidity}, SoilHum=${baseSoilHumidity}`);
      
      // Get current time and normalize to remove seconds and milliseconds
      // This ensures cleaner time intervals and better chart display
      const now = new Date();
      now.setSeconds(0, 0); // Reset seconds and milliseconds to zero
      console.log(`Starting predictions exactly from: ${now.toISOString()}`);
      
      const batch: PredictionData[] = [];
      
      // Add the current time data point first - this is crucial!
      // This represents the current condition prediction (right now)
      const currentPrediction = this.calculatePredictionPoint(
        baseTemp, baseAirHumidity, baseSoilHumidity,
        now, 0, // 0 hour offset because this is now
        0.1, // Minimal variation for current prediction
        0.1  // Minimal trend impact for current prediction
      );
      
      batch.push({
        ...currentPrediction,
        timestamp: now.toISOString().slice(0, 19).replace('T', ' ')
      });
      
      // Generate 12 hours of predictions at 15-minute intervals (short-term, high resolution)
      const shortTermHours = 12;
      const shortTermIntervals = shortTermHours * 4; // 15-minute intervals
      
      for (let i = 1; i <= shortTermIntervals; i++) { // Start from 1 since we added current time already
        const timestamp = new Date(now);
        const minutesOffset = i * 15; // 15-minute intervals
        timestamp.setMinutes(timestamp.getMinutes() + minutesOffset);
        
        // More precise predictions for the short term
        const hourOffset = minutesOffset / 60;
        const predictionPoint = this.calculatePredictionPoint(
          baseTemp, baseAirHumidity, baseSoilHumidity, 
          timestamp, hourOffset, 
          0.2, // Lower random variation for short-term
          1.5  // Lower multi-day trend impact
        );
        
        batch.push({
          ...predictionPoint,
          timestamp: timestamp.toISOString().slice(0, 19).replace('T', ' ')
        });
      }
      
      // Generate 30 days of predictions at hourly intervals (medium-term)
      const mediumTermDays = 30; // Full month
      const mediumTermIntervals = mediumTermDays * 24; // 1-hour intervals
      
      const lastShortTermTime = new Date(now);
      lastShortTermTime.setMinutes(lastShortTermTime.getMinutes() + (shortTermIntervals * 15));
      
      for (let i = 0; i < mediumTermIntervals; i++) {
        const timestamp = new Date(lastShortTermTime);
        timestamp.setHours(timestamp.getHours() + i); // 1 hour intervals
        
        // Standard predictions for medium term
        const hourOffset = shortTermHours + i;
        const predictionPoint = this.calculatePredictionPoint(
          baseTemp, baseAirHumidity, baseSoilHumidity, 
          timestamp, hourOffset, 
          0.5, // Medium random variation
          3.0  // Standard multi-day trend impact
        );
        
        batch.push({
          ...predictionPoint,
          timestamp: timestamp.toISOString().slice(0, 19).replace('T', ' ')
        });
      }
      
      // Save the batch of predictions
      return await this.savePredictionBatch(batch);
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw new Error(`Failed to generate predictions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate a single prediction data point using realistic patterns
   */
  private calculatePredictionPoint(
    baseTemp: number, 
    baseAirHumidity: number, 
    baseSoilHumidity: number,
    timestamp: Date,
    hourOffset: number,
    randomFactor: number = 0.5,
    trendImpact: number = 3.0
  ): { predicted_temp: number; predicted_air_humidity: number; predicted_soil_humidity: number } {
    // Hour of the day (0-23)
    const hourOfDay = timestamp.getHours();
    
    // Day of year (0-364)
    const dayOfYear = Math.floor(
      (timestamp.getTime() - new Date(timestamp.getFullYear(), 0, 0).getTime()) / 
      (24 * 60 * 60 * 1000)
    );
    
    // Day/night cycle - peaks at 14:00 (2pm), lowest at 2:00 (2am)
    // Using a shifted cosine wave for more realistic temperature pattern
    const dayNightCycle = Math.cos(((hourOfDay - 14) / 24) * 2 * Math.PI);
    
    // Seasonal variation - small impact over months
    const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.3;
    
    // Multi-day weather pattern (3-day cycle)
    const dayNumber = Math.floor(hourOffset / 24);
    const weatherPatternCycle = Math.sin((dayNumber / 3) * Math.PI) * 0.7;
    
    // Weather pattern transition (smoother changes between pattern cycles)
    const patternTransition = Math.sin((hourOffset / 72) * Math.PI) * trendImpact;
    
    // Small random variations for natural feel
    const tempVariation = ((Math.random() * 2) - 1) * (0.2 * randomFactor);
    const airHumidityVariation = ((Math.random() * 2) - 1) * (0.4 * randomFactor);
    const soilHumidityVariation = ((Math.random() * 2) - 1) * (0.2 * randomFactor);
    
    // Calculate predicted values with realistic factors
    
    // Temperature (°C) - Main factors: day/night cycle, weather patterns
    // Within a greenhouse, temperature typically has a ~5°C day/night difference
    // but remains more controlled than outdoor environments
    let predictedTemp = Number(baseTemp) + 
                      (dayNightCycle * 2.5) +    // Day/night (±2.5°C)
                      (seasonalFactor * 0.5) +   // Seasonal (±0.15°C)
                      (weatherPatternCycle * 0.8) + // Weather patterns (±0.56°C)
                      (patternTransition * 0.4) +   // Trend impact (±1.2°C max)
                      tempVariation;              // Random (±0.1°C)
    
    // Air humidity (%) - Typically inverse to temperature during the day
    // When temperature rises, relative humidity falls (and vice versa)
    let predictedAirHumidity = Number(baseAirHumidity) + 
                             (dayNightCycle * -4.0) +    // Inverse to temp (±4%)
                             (seasonalFactor * 1.0) +    // Seasonal (±0.3%)
                             (weatherPatternCycle * 2.0) + // Weather (±1.4%)
                             (patternTransition * -0.7) +  // Trend impact (±2.1% max)
                             airHumidityVariation;       // Random (±0.2%)
    
    // Soil humidity (%) - Changes more slowly than air humidity
    // Typically fluctuates less and has smaller daily variations
    let predictedSoilHumidity = Number(baseSoilHumidity) + 
                              (dayNightCycle * -0.8) +    // Small day effect (±0.8%)
                              (seasonalFactor * 0.7) +    // Seasonal (±0.21%)
                              (weatherPatternCycle * 1.2) + // Weather (±0.84%)
                              (patternTransition * -0.5) +  // Trend impact (±1.5% max)
                              soilHumidityVariation;     // Random (±0.1%)
    
    // Ensure values are within realistic greenhouse ranges
    // Temperature typically: 18-30°C
    predictedTemp = Math.max(18, Math.min(30, predictedTemp));
    
    // Humidity typically: 40-80%
    predictedAirHumidity = Math.max(40, Math.min(80, predictedAirHumidity));
    predictedSoilHumidity = Math.max(35, Math.min(70, predictedSoilHumidity));
    
    return {
      predicted_temp: parseFloat(predictedTemp.toFixed(1)),
      predicted_air_humidity: parseFloat(predictedAirHumidity.toFixed(1)),
      predicted_soil_humidity: parseFloat(predictedSoilHumidity.toFixed(1))
    };
  }

  /**
   * Generate predictions with default values when no sensor data is available
   */
  private async generatePredictionsWithDefaults(): Promise<number> {
    console.log('Generating predictions with default values');
    
    // Default starting values for a typical greenhouse environment
    const baseTemp = 23.5;
    const baseAirHumidity = 55.0;
    const baseSoilHumidity = 48.0;
    
    // Generate predictions with a higher resolution for short-term predictions
    // and lower resolution for long-term predictions
    const now = new Date();
    const batch: PredictionData[] = [];
    
    // Generate 12 hours of predictions at 15-minute intervals (short-term, high resolution)
    const shortTermHours = 12;
    const shortTermIntervals = shortTermHours * 4; // 15-minute intervals
    
    for (let i = 0; i < shortTermIntervals; i++) {
      const timestamp = new Date(now);
      const minutesOffset = i * 15; // 15-minute intervals
      timestamp.setMinutes(timestamp.getMinutes() + minutesOffset);
      
      // More precise predictions for the short term
      const hourOffset = minutesOffset / 60;
      const predictionPoint = this.calculatePredictionPoint(
        baseTemp, baseAirHumidity, baseSoilHumidity, 
        timestamp, hourOffset, 
        0.2, // Lower random variation for short-term
        1.5  // Lower multi-day trend impact
      );
      
      batch.push({
        ...predictionPoint,
        timestamp: timestamp.toISOString().slice(0, 19).replace('T', ' ')
      });
    }
    
    // Generate 30 days of predictions at hourly intervals (medium-term)
    const mediumTermDays = 30; // Full month
    const mediumTermIntervals = mediumTermDays * 24; // 1-hour intervals
    
    const lastShortTermTime = new Date(now);
    lastShortTermTime.setMinutes(lastShortTermTime.getMinutes() + (shortTermIntervals * 15));
    
    for (let i = 0; i < mediumTermIntervals; i++) {
      const timestamp = new Date(lastShortTermTime);
      timestamp.setHours(timestamp.getHours() + i); // 1 hour intervals
      
      // Standard predictions for medium term
      const hourOffset = shortTermHours + i;
      const predictionPoint = this.calculatePredictionPoint(
        baseTemp, baseAirHumidity, baseSoilHumidity, 
        timestamp, hourOffset, 
        0.5, // Medium random variation
        3.0  // Standard multi-day trend impact
      );
      
      batch.push({
        ...predictionPoint,
        timestamp: timestamp.toISOString().slice(0, 19).replace('T', ' ')
      });
    }
    
    // Save the batch of predictions
    return await this.savePredictionBatch(batch);
  }

  /**
   * Save a batch of prediction data records
   */
  async savePredictionBatch(predictions: PredictionData[]): Promise<number> {
    if (!predictions.length) return 0;
    
    try {
      // Log a sample of what we're trying to save
      console.log('Sample prediction data to save:', predictions[0]);
      
      // First ensure the table exists
      await this.ensureTableExists();
      
      // For debugging, print the SQL query we're about to run
      const values = predictions.map(p => [
        p.predicted_temp,
        p.predicted_air_humidity,
        p.predicted_soil_humidity,
        p.timestamp // Already formatted for MySQL
      ]);
      
      console.log(`Inserting ${values.length} prediction records...`);
      
      // Execute the batch insert
      const [result] = await pool.query(
        `INSERT INTO prediction_datas 
         (predicted_temp, predicted_air_humidity, predicted_soil_humidity, timestamp) 
         VALUES ?`,
        [values]
      );
      
      console.log('Database response:', result);
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
      console.log('Saving single prediction for testing:', data);
      
      // Ensure table exists
      await this.ensureTableExists();
      
      const [result] = await pool.query(
        `INSERT INTO prediction_datas 
         (predicted_temp, predicted_air_humidity, predicted_soil_humidity, timestamp) 
         VALUES (?, ?, ?, ?)`,
        [
          data.predicted_temp,
          data.predicted_air_humidity,
          data.predicted_soil_humidity,
          data.timestamp
        ]
      );
      
      console.log('Single insert result:', result);
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
      
      console.log('Cleared future prediction data, result:', result);
    } catch (error) {
      console.error('Error clearing future predictions:', error);
      // Don't throw here, just log the error
    }
  }

  /**
   * Clear all prediction data
   */
  async clearAllPredictions(): Promise<void> {
    try {
      const [result] = await pool.query('TRUNCATE TABLE prediction_datas');
      console.log('Cleared all prediction data, result:', result);
    } catch (error) {
      console.error('Error clearing all predictions:', error);
      // Don't throw here, just log the error
    }
  }
}

export default new PredictionModel(); 