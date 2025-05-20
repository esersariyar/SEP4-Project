import { Request, Response } from 'express';
import predictionModel, { PredictionData } from '../models/predictionModel';

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

      // First ensure the table exists
      await predictionModel.ensureTableExists();
      
      // Create a test record
      const now = new Date();
      const formattedTimestamp = now.toISOString().slice(0, 19).replace('T', ' ');
      
      const testData: PredictionData = {
        predicted_temp: 25.0,
        predicted_air_humidity: 55.0,
        predicted_soil_humidity: 50.0,
        predicted_co2_level: 800.0,
        predicted_light_lux: 1000.0,
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
      let isEmpty = false;
      
      try {
        predictionData = await predictionModel.getPredictions(hours, limit);
        
        // If no data in database, return empty flag
        if (!predictionData || predictionData.length === 0) {
          isEmpty = true;
        }
      } catch (dbError) {
        console.error('Error fetching from database:', dbError);
        throw dbError; // Let outer catch block handle this error
      }
      
      // Return the data or empty flag
      res.status(200).json({ 
        data: predictionData,
        empty: isEmpty,
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
      // Ensure both tables exist
      await predictionModel.ensureTableExists();
      await predictionModel.ensureSensorTableAndGetLatest();
      
      try {
        // Generate new predictions
        const count = await predictionModel.generatePredictions();
        
        if (count === 0) {
          return res.status(400).json({
            success: false,
            message: "No prediction records were generated",
            count: 0
          });
        }
        
        // Return success response
        return res.status(200).json({
          success: true,
          message: `Successfully generated ${count} prediction records`,
          count,
          _source: 'database'
        });
      } catch (dbError) {
        console.error('Database error generating predictions:', dbError);
        
        // Fall back to default generation
        try {
          const count = await predictionModel.generatePredictionsWithDefaults();
          
          if (count === 0) {
            throw new Error("Failed to generate predictions with defaults");
          }
          
          return res.status(200).json({
            success: true,
            message: `Generated ${count} prediction records with default values`,
            count,
            _source: 'database with defaults'
          });
        } catch (defaultError) {
          throw new Error(`Failed to generate default predictions: ${defaultError instanceof Error ? defaultError.message : 'Unknown error'}`);
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







