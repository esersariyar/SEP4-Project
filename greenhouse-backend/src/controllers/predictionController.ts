
import { Request, Response } from 'express';
import predictionModel, { PredictionData } from '../models/predictionModel';

// Mock prediction data for fallback only when database is completely unavailable
const generateMockPredictions = (hours = 168): PredictionData[] => {
  const data: PredictionData[] = [];
  const now = new Date();
  
  // Base values for each sensor with some randomization
  const baseTemp = 22.0 + (Math.random() * 4); // Range: 22-26
  const baseAirHumidity = 52.0 + (Math.random() * 8); // Range: 52-60
  const baseSoilHumidity = 48.0 + (Math.random() * 6); // Range: 48-54
  
  // Create weather event simulations
  // This creates random "events" that will affect the sensor data
  const weatherEvents = [];
  
  // Random heat/cool wave (affects 6-12 hour spans)
  const heatWaveCount = Math.floor(Math.random() * 3) + 1; // 1-3 heat/cool events
  for (let i = 0; i < heatWaveCount; i++) {
    const startHour = Math.floor(Math.random() * (hours - 12));
    const duration = Math.floor(Math.random() * 6) + 6; // 6-12 hours
    const intensity = (Math.random() * 2) + 1; // 1-3 degree change
    const isHeatWave = Math.random() > 0.5;
    
    weatherEvents.push({
      type: isHeatWave ? 'heat' : 'cool',
      startHour,
      endHour: startHour + duration,
      intensity: isHeatWave ? intensity : -intensity
    });
  }
  
  // Random humidity changes (affects 4-8 hour spans)
  const humidityEventCount = Math.floor(Math.random() * 3) + 1; // 1-3 humidity events
  for (let i = 0; i < humidityEventCount; i++) {
    const startHour = Math.floor(Math.random() * (hours - 8));
    const duration = Math.floor(Math.random() * 4) + 4; // 4-8 hours
    const intensity = (Math.random() * 8) + 5; // 5-13% change
    const isIncrease = Math.random() > 0.5;
    
    weatherEvents.push({
      type: 'humidity',
      startHour,
      endHour: startHour + duration,
      intensity: isIncrease ? intensity : -intensity
    });
  }
  
  // Generate predictions for the specified number of hours in hourly intervals
  const intervals = hours; // 1 data point per hour
  
  for (let i = 0; i < intervals; i++) {
    const timestamp = new Date(now);
    timestamp.setHours(timestamp.getHours() + i); // Hourly intervals
    
    // Add daily cycle variation (natural day/night pattern)
    const hourOfDay = timestamp.getHours();
    const dayOfYear = Math.floor((timestamp.getTime() - new Date(timestamp.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
    
    // Day/night cycle with randomized phase shift to make each day slightly different
    const phaseShift = (i / 24) * 0.5; // Slight shift each day
    const dayNightCycle = Math.sin(((hourOfDay - 6) * Math.PI / 12) + phaseShift);
    
    // Multi-day trend (creates a slower changing pattern)
    const multiDayTrend = Math.sin((i / 72) * Math.PI) * 1.2;
    
    // Apply different weights for different sensors
    const tempDayNightEffect = dayNightCycle * 3.5; // Temperature varies more with day/night
    const airHumidityDayNightEffect = dayNightCycle * -2.0; // Humidity is inverse to temperature
    const soilHumidityDayNightEffect = dayNightCycle * -0.8; // Soil responds slower than air
    
    // Add random variations of different magnitudes
    const tempVariation = (Math.random() * 2 - 1) * 0.5;
    const airHumidityVariation = (Math.random() * 4 - 2) * 0.8;
    const soilHumidityVariation = (Math.random() * 3 - 1.5) * 0.4;
    
    // Start with base values
    let predictedTemp = baseTemp + tempDayNightEffect + multiDayTrend * 0.8 + tempVariation;
    let predictedAirHumidity = baseAirHumidity + airHumidityDayNightEffect + multiDayTrend * -0.5 + airHumidityVariation;
    let predictedSoilHumidity = baseSoilHumidity + soilHumidityDayNightEffect + multiDayTrend * -0.3 + soilHumidityVariation;
    
    // Apply weather events
    for (const event of weatherEvents) {
      if (i >= event.startHour && i <= event.endHour) {
        // Calculate how far into the event we are (0-1)
        const progress = (i - event.startHour) / (event.endHour - event.startHour);
        
        // Apply a bell curve effect (strongest in the middle)
        const effectStrength = Math.sin(progress * Math.PI);
        
        // Apply the effect based on event type
        if (event.type === 'heat' || event.type === 'cool') {
          predictedTemp += event.intensity * effectStrength;
        } else if (event.type === 'humidity') {
          predictedAirHumidity += event.intensity * effectStrength;
          // Soil humidity changes more slowly and less dramatically
          predictedSoilHumidity += (event.intensity * 0.4) * effectStrength;
        }
      }
    }
    
    // Format timestamp as MySQL-compatible string
    const formattedTimestamp = timestamp.toISOString().slice(0, 19).replace('T', ' ');
    
    // Add data point
    data.push({
      id: i + 1,
      predicted_temp: Number(predictedTemp.toFixed(1)),
      predicted_air_humidity: Number(predictedAirHumidity.toFixed(1)),
      predicted_soil_humidity: Number(predictedSoilHumidity.toFixed(1)),
      timestamp: formattedTimestamp
    });
  }
  
  return data;
};

class PredictionController {
  constructor() {
    // Bind all methods to this instance to ensure proper 'this' context
    this.getPredictions = this.getPredictions.bind(this);
    this.generatePredictions = this.generatePredictions.bind(this);
    this.testDatabaseConnection = this.testDatabaseConnection.bind(this);
  }

  /**
   * Test the database connection and table structure
   */
  async testDatabaseConnection(req: Request, res: Response) {
    try {
      console.log("Testing database connection...");

      // First ensure the table exists
      await predictionModel.ensureTableExists();
      
      // Create a test record
      const now = new Date();
      const formattedTimestamp = now.toISOString().slice(0, 19).replace('T', ' ');
      
      const testData: PredictionData = {
        predicted_temp: 25.0,
        predicted_air_humidity: 55.0,
        predicted_soil_humidity: 50.0,
        timestamp: formattedTimestamp
      };
      
      // Attempt to save a single test record
      const insertId = await predictionModel.saveSinglePrediction(testData);
      
      return res.status(200).json({
        success: true,
        message: `Database connection test successful! Created test record with ID: ${insertId}`,
        test_record: {
          ...testData,
          id: insertId
        }
      });
    } catch (error) {
      console.error('Database connection test failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Database connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get prediction data for the specified time range
   */
  async getPredictions(req: Request, res: Response) {
    try {
      const range = (req.query.range as string) || '24h';
      let hours = 24; // Default to 24 hours
      
      // Parse the range parameter
      switch (range) {
        case '6h':
          hours = 6;
          break;
        case '12h':
          hours = 12;
          break;
        case '24h':
          hours = 24;
          break;
        case '3d':
          hours = 72;
          break;
        case '7d':
          hours = 168; // One week
          break;
        case '14d':
          hours = 336; // Two weeks
          break;
        case '30d':
          hours = 720; // Approximately one month
          break;
        default:
          hours = 24;
      }
      
      // Use a much higher limit to ensure we get all data
      // Frontend can filter/sample as needed
      const limit = parseInt(req.query.limit as string) || 5000;
      
      let predictionData: PredictionData[] = [];
      let source = 'database';
      
      try {
        console.log("Attempting to fetch predictions from database");
        predictionData = await predictionModel.getPredictions(hours, limit);
        
        // If no data in database, automatically generate some
        if (!predictionData || predictionData.length === 0) {
          console.log("No prediction data in database, generating new predictions");
          
          try {
            // Generate and store new predictions
            const count = await predictionModel.generatePredictions();
            console.log(`Generated and stored ${count} new prediction records`);
            
            // Now fetch the newly created predictions
            predictionData = await predictionModel.getPredictions(hours, limit);
            source = 'database (newly generated)';
            
            if (!predictionData || predictionData.length === 0) {
              throw new Error('Failed to retrieve newly generated predictions');
            }
          } catch (genError) {
            console.error("Error generating predictions:", genError);
            
            // Only use mock data if we still have no data after trying to generate
            console.log("Falling back to mock data as last resort");
            predictionData = generateMockPredictions(hours);
            source = 'mock';
            
            // Try to save the mock data to database
            try {
              const savedCount = await predictionModel.savePredictionBatch(predictionData);
              console.log(`Saved ${savedCount} mock records to database`);
              source = 'mock saved to database';
            } catch (saveError) {
              console.error("Failed to save mock data to database:", saveError);
            }
          }
        } else {
          console.log(`Successfully retrieved ${predictionData.length} prediction records from database`);
        }
      } catch (dbError) {
        console.error('Error fetching from database:', dbError);
        
        // Generate mock data
        console.log("Database error, generating mock data");
        predictionData = generateMockPredictions(hours);
        source = 'mock (database error)';
        
        // Try to save the mock data to database
        try {
          const savedCount = await predictionModel.savePredictionBatch(predictionData);
          console.log(`Saved ${savedCount} mock records to database after error`);
          source = 'mock saved to database after error';
        } catch (saveError) {
          console.error("Failed to save mock data to database after error:", saveError);
        }
      }
      
      // Return the data
      res.status(200).json({ 
        data: predictionData,
        range,
        hours,
        count: predictionData.length,
        _source: source
      });
    } catch (error) {
      console.error('Error getting predictions:', error);
      res.status(500).json({ message: 'Server error fetching prediction data' });
    }
  }

  /**
   * Generate new prediction data based on current sensor readings
   */
  async generatePredictions(req: Request, res: Response) {
    try {
      console.log("Starting prediction generation process");
      
      // First try to generate predictions using the database model
      try {
        // Ensure the table exists first
        await predictionModel.ensureTableExists();
        
        // Generate new predictions
        const count = await predictionModel.generatePredictions();
        console.log(`Successfully generated ${count} prediction records in database`);
        
        // Return success response
        return res.status(200).json({
          success: true,
          message: `Successfully generated ${count} prediction records`,
          count,
          _source: 'database'
        });
      } catch (dbError) {
        console.error('Database error generating predictions:', dbError);
        
        // If database fails, generate mock data and try to save it to database
        const mockData = generateMockPredictions(24);
        console.log(`Generated ${mockData.length} mock prediction records`);
        
        try {
          // Try to save the mock data to the database
          const count = await predictionModel.savePredictionBatch(mockData);
          console.log(`Successfully saved ${count} mock predictions to database`);
          
          return res.status(200).json({
            success: true,
            message: `Generated ${count} prediction records (from mock data)`,
            count,
            _source: 'mock data saved to database'
          });
        } catch (saveError) {
          console.error('Error saving mock data to database:', saveError);
          
          // If saving to database also fails, just return the mock data
          return res.status(200).json({
            success: true,
            message: `Generated ${mockData.length} mock prediction records (database unavailable)`,
            count: mockData.length,
            _source: 'mock (in-memory only)'
          });
        }
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error generating prediction data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new PredictionController(); 







