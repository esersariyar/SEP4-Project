import pool from '../config/db';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { RowDataPacket } from 'mysql2';

export interface SensorData {
  id?: number;
  temperature: number;
  air_humidity: number;
  soil_humidity: number;
  co2_level: number;
  light_lux: number;
  timestamp?: string;
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
      
      // Veritabanındaki tüm kayıtları kontrol et
      const [allRecords] = await connection.query<RowDataPacket[]>(
        `SELECT 
          id,
          timestamp,
          temperature
        FROM sensor_data 
        ORDER BY timestamp DESC 
        LIMIT 20`
      );
      
      console.log('Veritabanındaki son 20 kayıt:', allRecords.map(record => ({
        id: record.id,
        timestamp: record.timestamp,
        temperature: record.temperature
      })));

      // Şimdi tüm kayıtları al
      const [records] = await connection.query<RowDataPacket[]>(
        `SELECT 
          id,
          temperature,
          air_humidity,
          soil_humidity,
          co2_level,
          light_lux,
          timestamp
        FROM sensor_data 
        ORDER BY timestamp DESC`  // En yeni kayıtlar önce
      );

      console.log('Sorgu sonuçları:', {
        toplamKayit: records.length,
        enYeniKayit: records[0]?.timestamp,
        enEskiKayit: records[records.length - 1]?.timestamp
      });

      // Verileri dönüştür ve sırala
      const data: SensorData[] = records
        .map((row: any) => ({
          id: row.id,
          temperature: row.temperature,
          air_humidity: row.air_humidity,
          soil_humidity: row.soil_humidity,
          co2_level: row.co2_level,
          light_lux: row.light_lux,
          timestamp: row.timestamp
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Eski kayıtlar önce

      connection.release();
      return data;
    } catch (error) {
      console.error('Veri çekerken hata:', error);
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
    try {
      console.log(`[${new Date().toISOString()}] Saving data to database:`, data);
      
      // Minimum değerleri kontrol et ve düzelt
      const validatedData = {
        ...data,
        light_lux: Math.max(data.light_lux || 500, 500), // Minimum 500 lux
        temperature: Math.max(data.temperature || 15, 15), // Minimum 15°C
        air_humidity: Math.max(data.air_humidity || 30, 30), // Minimum 30%
        soil_humidity: Math.max(data.soil_humidity || 30, 30), // Minimum 30%
        co2_level: Math.max(data.co2_level || 400, 400) // Minimum 400 ppm
      };
      
      const [result] = await pool.query(
        'INSERT INTO sensor_data (temperature, air_humidity, soil_humidity, co2_level, light_lux, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [
          validatedData.temperature, 
          validatedData.air_humidity, 
          validatedData.soil_humidity, 
          validatedData.co2_level,
          validatedData.light_lux,
          validatedData.timestamp || this.getCurrentDenmarkTimeISOString()
        ]
      );
      
      console.log(`[${new Date().toISOString()}] Database result:`, result);
      return (result as any).insertId;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error saving data to database:`, error);
      throw error;
    }
  }

  /**
   * Save multiple sensor data records in a batch for better performance
   */
  async saveSensorDataBatch(dataList: SensorData[]): Promise<number> {
    if (dataList.length === 0) {
      return 0;
    }
    
    // Verileri doğrula ve minimum değerleri ayarla
    const validatedDataList = dataList.map(data => ({
      ...data,
      light_lux: Math.max(data.light_lux || 500, 500), // Minimum 500 lux
      temperature: Math.max(data.temperature || 15, 15), // Minimum 15°C
      air_humidity: Math.max(data.air_humidity || 30, 30), // Minimum 30%
      soil_humidity: Math.max(data.soil_humidity || 30, 30), // Minimum 30%
      co2_level: Math.max(data.co2_level || 400, 400) // Minimum 400 ppm
    }));
    
    // Create the values part of the query for multiple inserts
    const placeholders = validatedDataList.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const values = validatedDataList.flatMap(data => [
      data.temperature, 
      data.air_humidity, 
      data.soil_humidity, 
      data.co2_level,
      data.light_lux,
      data.timestamp || this.getCurrentDenmarkTimeISOString()
    ]);
    
    const query = `INSERT INTO sensor_data (temperature, air_humidity, soil_humidity, co2_level, light_lux, timestamp) VALUES ${placeholders}`;
    
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
