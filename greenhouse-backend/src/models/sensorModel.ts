import pool from '../config/db';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { RowDataPacket } from 'mysql2';

export interface SensorData {
  id?: number;
  temperature: number;
  humidity: number;
  prediction: 'Normal' | 'Alert' | 'Warning';
  timestamp: string;
}

class SensorModel {

  async getCurrentData(): Promise<SensorData> {
    const [rows] = await pool.query(
      'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1'
    );
    return (rows as SensorData[])[0];
  }


  async getHistoricalData(hours = 24, limit = 100): Promise<SensorData[]> {
    try {
      const connection = await pool.getConnection();
      
      // First check if there's any data in the database
      const [countResult] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM sensor_data');
      const count = countResult[0].count;
      
      if (count === 0) {
        // Database is empty
        connection.release();
        return [];
      }
      
      // Get timestamp for X hours ago in Denmark timezone
      const now = new Date();
      const hoursAgo = new Date(now.getTime() - (hours * 60 * 60 * 1000));
      
      // Format timestamps for MySQL query
      const nowFormatted = now.toISOString().slice(0, 19).replace('T', ' ');
      const hoursAgoFormatted = hoursAgo.toISOString().slice(0, 19).replace('T', ' ');
      
      // Query with limit
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM sensor_data WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp ASC LIMIT ?',
        [hoursAgoFormatted, nowFormatted, limit]
      );
      
      connection.release();
      
      // Map the rows to the SensorData type
      const data: SensorData[] = rows.map((row: any) => ({
        id: row.id,
        temperature: row.temperature,
        humidity: row.humidity,
        prediction: row.prediction,
        timestamp: row.timestamp
      }));
      
      // If data is empty or less than needed
      if (data.length === 0) {
        return [];
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }


  private downsampleData(data: SensorData[], targetPoints: number): SensorData[] {
    if (data.length <= targetPoints) {
      return data;
    }
    

    const step = Math.max(1, Math.floor(data.length / targetPoints));
    

    const sampledData: SensorData[] = [];
    

    sampledData.push(data[0]);
    

    for (let i = step; i < data.length - step; i += step) {
      sampledData.push(data[i]);
    }
    

    if (sampledData[sampledData.length - 1] !== data[data.length - 1]) {
      sampledData.push(data[data.length - 1]);
    }
    
    return sampledData;
  }


  async saveSensorData(data: SensorData): Promise<number> {
    const [result] = await pool.query(
      'INSERT INTO sensor_data (temperature, humidity, prediction, timestamp) VALUES (?, ?, ?, ?)',
      [data.temperature, data.humidity, data.prediction, data.timestamp || this.getCurrentDenmarkTimeISOString()]
    );
    return (result as any).insertId;
  }

  /**
   * Save multiple sensor data records in a batch for better performance
   */
  async saveSensorDataBatch(dataList: SensorData[]): Promise<number> {
    if (dataList.length === 0) {
      return 0;
    }
    
    // Create the values part of the query for multiple inserts
    const placeholders = dataList.map(() => '(?, ?, ?, ?)').join(', ');
    const values = dataList.flatMap(data => [
      data.temperature, 
      data.humidity, 
      data.prediction, 
      data.timestamp || this.getCurrentDenmarkTimeISOString()
    ]);
    
    const query = `INSERT INTO sensor_data (temperature, humidity, prediction, timestamp) VALUES ${placeholders}`;
    
    const [result] = await pool.query(query, values);
    
    return (result as any).affectedRows || 0;
  }

  /**
   * Helper method to get current time in Denmark timezone (Europe/Copenhagen)
   */
  private getCurrentDenmarkTimeISOString(): string {
    const now = new Date();
    const timeZone = 'Europe/Copenhagen';
    return formatInTimeZone(now, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
  }

  /**
   * Clear all sensor data from the database
   */
  async clearAllData(): Promise<number> {
    try {
      const [result] = await pool.query('DELETE FROM sensor_data');
      return (result as any).affectedRows || 0;
    } catch (error) {
      console.error('Error clearing sensor data:', error);
      throw error;
    }
  }
}

export default new SensorModel();
