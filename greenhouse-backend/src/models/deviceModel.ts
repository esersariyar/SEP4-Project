import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import pool from '../config/db';
import { formatInTimeZone } from 'date-fns-tz';

export interface Device extends RowDataPacket {
  id: number;
  name: string;
  type: string;
  status: string;
  creation_date: Date;
  last_update: Date;
  value?: number; // For sensors like temperature, humidity etc.
  isInteractive?: boolean; // Only actuators are interactive
  isOn?: boolean; // For actuators
  icon?: string; // Device icon
  unit?: string; // Unit for sensor values (°C, %, lux, ppm)
}

export interface DeviceLog extends RowDataPacket {
  id: number;
  device_id: number;
  user_id?: number;
  username?: string;
  action_type: 'value_change' | 'status_change';
  old_value?: string;
  new_value: string;
  log_time: Date;
}

export class DeviceModel {
  
  // Static constructor to ensure device_logs table exists
  static {
    // Initialize the device_logs table
    (async () => {
      const connection = await pool.getConnection();
      try {
        // Create device_logs table if it doesn't exist
        await connection.query(`
          CREATE TABLE IF NOT EXISTS device_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            device_id INT NOT NULL,
            user_id INT,
            username VARCHAR(50),
            action_type ENUM('value_change', 'status_change') NOT NULL,
            old_value VARCHAR(100),
            new_value VARCHAR(100) NOT NULL,
            log_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_device_id (device_id),
            INDEX idx_log_time (log_time)
          )
        `);
        console.log('Device logs table initialized successfully');
      } catch (error) {
        console.error('Error initializing device_logs table:', error);
      } finally {
        connection.release();
      }
    })();
  }
  
  /**
   * Get all devices from the database
   */
  public static async getAllDevices(): Promise<Device[]> {
    const connection: PoolConnection = await pool.getConnection();
    try {
      // Get all devices from DB
      const [devices] = await connection.query<Device[]>(
        'SELECT * FROM devices'
      );

      // Update last_update timestamp for each device
      for (const device of devices) {
        await connection.query(
          'UPDATE devices SET last_update = NOW() WHERE id = ?',
          [device.id]
        );
      }

      // Process the devices to add frontend properties
      return devices.map(device => {
        const isInteractive = device.type === 'actuator';
        const isOn = device.status === 'Active';
        
        // Add random values for sensor readings
        let value;
        if (device.type === 'sensor') {
          if (device.name.toLowerCase().includes('temperature')) {
            value = Math.floor(Math.random() * 15) + 15; // Temperature between 15-30°C
          } else if (device.name.toLowerCase().includes('humidity')) {
            value = Math.floor(Math.random() * 50) + 30; // Humidity between 30-80%
          } else if (device.name.toLowerCase().includes('light')) {
            value = Math.floor(Math.random() * 800) + 200; // Light level between 200-1000 lux
          } else if (device.name.toLowerCase().includes('co2')) {
            value = Math.floor(Math.random() * 800) + 400; // CO2 between 400-1200 ppm
          }
        }
        
        // Set current time as last_update
        device.last_update = new Date();
        
        // Add icon and unit based on device type
        const icon = this.getDeviceIcon(device.name);
        const unit = this.getDeviceUnit(device.name);
        
        return {
          ...device,
          isInteractive,
          isOn,
          value,
          icon,
          unit
        };
      });
    } finally {
      connection.release();
    }
  }

  /**
   * Update device status and log the change
   */
  public static async updateDeviceStatus(
    id: number, 
    newStatus: string, 
    userInfo?: { userId?: number | null, username?: string | null }
  ): Promise<Device | null> {
    const connection: PoolConnection = await pool.getConnection();
    try {
      // Get current device status for logging
      const [deviceRows] = await connection.query<Device[]>(
        'SELECT * FROM devices WHERE id = ?',
        [id]
      );
      
      if (deviceRows.length === 0) {
        return null; // Device not found
      }
      
      const oldStatus = deviceRows[0].status;
      
      // Convert on/off to Active/Inactive
      const dbStatus = newStatus === 'on' ? 'Active' : 'Inactive';
      
      // Update both status and last_update timestamp
      const [result] = await connection.query<ResultSetHeader>(
        'UPDATE devices SET status = ?, last_update = NOW() WHERE id = ?',
        [dbStatus, id]
      );
      
      if (result.affectedRows > 0) {
        // Log the status change
        await this.logDeviceAction({
          device_id: id,
          user_id: userInfo?.userId || null,
          username: userInfo?.username || null,
          action_type: 'status_change',
          old_value: oldStatus,
          new_value: dbStatus
        });
        
        // Return updated device
        return this.getDeviceById(id);
      }
      
      return null;
    } finally {
      connection.release();
    }
  }

  /**
   * Update device sensor value and log the change
   * This will also update the last_update timestamp
   */
  public static async updateSensorValue(
    id: number, 
    newValue: number, 
    userInfo?: { userId?: number | null, username?: string | null }
  ): Promise<Device | null> {
    const connection: PoolConnection = await pool.getConnection();
    try {
      // First check if the device exists and is a sensor
      const [deviceRows] = await connection.query<Device[]>(
        'SELECT * FROM devices WHERE id = ? AND type = "sensor"',
        [id]
      );
      
      if (deviceRows.length === 0) {
        return null; // Device not found or not a sensor
      }
      
      // Get current value for logging (this is a mock value as we don't store it in DB)
      const oldValue = this.getMockValue(deviceRows[0].name);
      
      // We don't store the value in the DB, but we update the last_update timestamp
      // when a sensor value changes
      const [result] = await connection.query<ResultSetHeader>(
        'UPDATE devices SET last_update = NOW() WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows > 0) {
        // Log the value change
        await this.logDeviceAction({
          device_id: id,
          user_id: userInfo?.userId || null,
          username: userInfo?.username || null,
          action_type: 'value_change',
          old_value: oldValue ? oldValue.toString() : undefined,
          new_value: newValue.toString()
        });
        
        // Return updated device
        return this.getDeviceById(id);
      }
      
      return null;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Get mock value for a sensor based on its name
   */
  private static getMockValue(deviceName: string): number | undefined {
    const name = deviceName.toLowerCase();
    if (name.includes('temperature')) {
      return Math.floor(Math.random() * 15) + 15;
    } else if (name.includes('humidity')) {
      return Math.floor(Math.random() * 50) + 30;
    } else if (name.includes('light')) {
      return Math.floor(Math.random() * 800) + 200;
    } else if (name.includes('co2')) {
      return Math.floor(Math.random() * 800) + 400;
    }
    return undefined;
  }
  
  /**
   * Log device action (status or value change) to device_logs table
   */
  private static async logDeviceAction(logData: Omit<DeviceLog, 'id' | 'log_time'>): Promise<number> {
    const connection: PoolConnection = await pool.getConnection();
    
    try {
      const query = `
        INSERT INTO device_logs 
        (device_id, user_id, username, action_type, old_value, new_value) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.query<ResultSetHeader>(
        query,
        [
          logData.device_id,
          logData.user_id || null,
          logData.username || null,
          logData.action_type,
          logData.old_value || null,
          logData.new_value
        ]
      );
      
      return result.insertId;
    } catch (error) {
      return 0; // Return 0 for failed log (but we don't fail the main operation)
    } finally {
      connection.release();
    }
  }
  
  /**
   * Get current Denmark time in ISO format
   */
  private static getCurrentDenmarkTimeISOString(): string {
    const now = new Date();
    const timeZone = 'Europe/Copenhagen';
    return formatInTimeZone(now, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
  }

  /**
   * Get device logs with optional filtering
   */
  public static async getDeviceLogs(
    deviceId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<DeviceLog[]> {
    const connection: PoolConnection = await pool.getConnection();
    try {
      // Build the query with deviceId filter
      const query = `
        SELECT * FROM device_logs
        WHERE device_id = ?
        ORDER BY log_time DESC
        LIMIT ? OFFSET ?
      `;
      
      const [logs] = await connection.query<DeviceLog[]>(
        query,
        [deviceId, limit, offset]
      );
      
      return logs;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all device logs with optional filtering
   */
  public static async getAllDeviceLogs(
    deviceId: number | null = null,
    actionType: string | null = null,
    limit: number = 50,
    offset: number = 0
  ): Promise<DeviceLog[]> {
    const connection: PoolConnection = await pool.getConnection();
    try {
      // Build the query with optional filters
      let query = 'SELECT * FROM device_logs WHERE 1=1';
      const params: any[] = [];
      
      // Add device filter if provided
      if (deviceId !== null) {
        query += ' AND device_id = ?';
        params.push(deviceId);
      }
      
      // Add action type filter if provided
      if (actionType !== null && actionType !== 'all') {
        query += ' AND action_type = ?';
        params.push(actionType);
      }
      
      // Add order by, limit and offset
      query += ' ORDER BY log_time DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [logs] = await connection.query<DeviceLog[]>(query, params);
      
      return logs;
    } finally {
      connection.release();
    }
  }

  /**
   * Get device by ID
   */
  public static async getDeviceById(id: number): Promise<Device | null> {
    const connection: PoolConnection = await pool.getConnection();
    try {
      const [devices] = await connection.query<Device[]>(
        'SELECT * FROM devices WHERE id = ?',
        [id]
      );

      if (devices.length === 0) {
        return null;
      }

      // Update last_update timestamp
      await connection.query(
        'UPDATE devices SET last_update = NOW() WHERE id = ?',
        [id]
      );

      const device = devices[0];
      const isInteractive = device.type === 'actuator';
      const isOn = device.status === 'Active';
      
      // Add random values for sensor readings
      let value;
      if (device.type === 'sensor') {
        if (device.name.toLowerCase().includes('temperature')) {
          value = Math.floor(Math.random() * 15) + 15; // Temperature between 15-30°C
        } else if (device.name.toLowerCase().includes('humidity')) {
          value = Math.floor(Math.random() * 50) + 30; // Humidity between 30-80%
        } else if (device.name.toLowerCase().includes('light')) {
          value = Math.floor(Math.random() * 800) + 200; // Light level between 200-1000 lux
        } else if (device.name.toLowerCase().includes('co2')) {
          value = Math.floor(Math.random() * 800) + 400; // CO2 between 400-1200 ppm
        }
      }
      
      // Update last_update in the response object
      device.last_update = new Date();
      
      // Add icon and unit based on device type
      const icon = this.getDeviceIcon(device.name);
      const unit = this.getDeviceUnit(device.name);
      
      return {
        ...device,
        isInteractive,
        isOn,
        value,
        icon,
        unit
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Generate sample devices (for when DB is empty)
   */
  public static getSampleDevices(): any[] {
    return [
      {
        id: 1,
        name: 'Temperature Sensor 1',
        type: 'sensor',
        status: 'Normal',
        creation_date: new Date('2025-01-01'),
        last_update: new Date(),
        value: 23.5,
        isInteractive: false,
        icon: 'bi-thermometer-half',
        unit: '°C'
      },
      {
        id: 2,
        name: 'Humidity Sensor 1',
        type: 'sensor',
        status: 'Normal',
        creation_date: new Date('2025-01-01'),
        last_update: new Date(),
        value: 68.2,
        isInteractive: false,
        icon: 'bi-droplet',
        unit: '%'
      },
      {
        id: 3,
        name: 'Light Sensor 1',
        type: 'sensor',
        status: 'Normal',
        creation_date: new Date('2025-01-01'),
        last_update: new Date(),
        value: 750,
        isInteractive: false,
        icon: 'bi-brightness-high',
        unit: 'lux'
      },
      {
        id: 4,
        name: 'Ventilation Fan',
        type: 'actuator',
        status: 'Inactive',
        creation_date: new Date('2025-01-01'),
        last_update: new Date(),
        isInteractive: true,
        isOn: false,
        icon: 'bi-fan'
      },
      {
        id: 5,
        name: 'Irrigation System',
        type: 'actuator',
        status: 'Active',
        creation_date: new Date('2025-01-01'),
        last_update: new Date(),
        isInteractive: true,
        isOn: true,
        icon: 'bi-water'
      }
    ];
  }

  /**
   * Determines the appropriate icon based on device name
   */
  private static getDeviceIcon(deviceName: string): string {
    const name = deviceName.toLowerCase();
    
    if (name.includes('temperature')) return 'bi-thermometer-half';
    if (name.includes('humidity')) return 'bi-droplet';
    if (name.includes('water') || name.includes('irrigation')) return 'bi-water';
    if (name.includes('light') || name.includes('led')) return 'bi-brightness-high';
    if (name.includes('fan') || name.includes('ventilation')) return 'bi-fan';
    if (name.includes('co2')) return 'bi-cloud';
    if (name.includes('soil')) return 'bi-flower1';
    
    // Default icons based on device type
    if (name.includes('sensor')) return 'bi-activity';
    if (name.includes('actuator')) return 'bi-toggle-on';
    
    // Fallback default
    return 'bi-device-hdd';
  }
  
  /**
   * Determines the unit for a sensor based on its name
   */
  private static getDeviceUnit(deviceName: string): string | undefined {
    const name = deviceName.toLowerCase();
    
    if (name.includes('temperature')) return '°C';
    if (name.includes('humidity')) return '%';
    if (name.includes('light')) return 'lux';
    if (name.includes('co2')) return 'ppm';
    if (name.includes('soil moisture')) return '%';
    
    // No unit for actuators and other sensor types
    return undefined;
  }
}
