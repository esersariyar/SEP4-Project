import { Request, Response } from 'express';
import { DeviceModel, Device, DeviceLog } from '../models/deviceModel';
import { formatInTimeZone } from 'date-fns-tz';

// Denmark timezone
const DENMARK_TIMEZONE = 'Europe/Copenhagen';

export const deviceController = {
  /**
   * Get all devices
   * @route GET /api/devices
   * @access Public
   */
  getAllDevices: async (req: Request, res: Response): Promise<void> => {
    try {
      const devices = await DeviceModel.getAllDevices();
      
      if (devices.length > 0) {
        res.status(200).json(devices);
      } else {
        // If no devices in database, respond with sample devices
        const sampleDevices = DeviceModel.getSampleDevices();
        res.status(200).json(sampleDevices);
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error when fetching devices' });
    }
  },
  
  /**
   * Toggle device status (for actuators)
   * @route PUT /api/devices/:id/toggle
   * @access Public
   */
  toggleDevice: async (req: Request, res: Response): Promise<void> => {
    try {
      const deviceId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(deviceId)) {
        res.status(400).json({ message: 'Invalid device ID' });
        return;
      }
      
      if (status === undefined || (status !== 'on' && status !== 'off')) {
        res.status(400).json({ 
          message: 'Status must be "on" or "off"',
          received: status
        });
        return;
      }
      
      // Get user information from auth middleware if available
      let userId: number | null = null;
      let username: string | null = null;
      
      if (req.user) {
        userId = req.user.id;
        username = req.user.username;
      }
      
      // Get current device to track change
      const currentDevice = await DeviceModel.getDeviceById(deviceId);
      
      if (!currentDevice) {
        res.status(404).json({ message: 'Device not found' });
        return;
      }
      
      // Check if device is an actuator
      if (currentDevice.type !== 'actuator') {
        res.status(400).json({ message: 'Only actuator devices can be toggled' });
        return;
      }
      
      // Update the device status
      const updatedDevice = await DeviceModel.updateDeviceStatus(
        deviceId, 
        status,
        { userId, username }
      );
      
      if (!updatedDevice) {
        res.status(404).json({ message: 'Device not found' });
        return;
      }
      
      res.status(200).json(updatedDevice);
    } catch (error) {
      console.error('Error toggling device:', error);
      res.status(500).json({ message: 'Server error when toggling device' });
    }
  },
  
  /**
   * Update sensor value (for sensors like CO2, light/lux etc.)
   * @route PUT /api/devices/:id/value
   * @access Public
   */
  updateSensorValue: async (req: Request, res: Response): Promise<void> => {
    try {
      const deviceId = parseInt(req.params.id);
      const { value } = req.body;
      
      if (isNaN(deviceId)) {
        res.status(400).json({ message: 'Invalid device ID' });
        return;
      }
      
      if (value === undefined || value === null) {
        res.status(400).json({ message: 'Value is required' });
        return;
      }
      
      // Get user information from auth middleware if available
      let userId: number | null = null;
      let username: string | null = null;
      
      if (req.user) {
        userId = req.user.id;
        username = req.user.username;
      }
      
      // Get current device to track change
      const currentDevice = await DeviceModel.getDeviceById(deviceId);
      
      if (!currentDevice) {
        res.status(404).json({ message: 'Device not found' });
        return;
      }
      
      // Update the device value
      const updatedDevice = await DeviceModel.updateSensorValue(
        deviceId, 
        value,
        { userId, username }
      );
      
      if (!updatedDevice) {
        res.status(404).json({ message: 'Device not found' });
        return;
      }
      
      res.status(200).json(updatedDevice);
    } catch (error) {
      res.status(500).json({ message: 'Server error when updating sensor value' });
    }
  },
  
  /**
   * Get all device logs with optional filtering
   * @route GET /api/devices/logs
   * @access Public
   */
  getAllDeviceLogs: async (req: Request, res: Response): Promise<void> => {
    try {
      // Get pagination parameters if any
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get optional device filter
      const deviceId = req.query.deviceId ? parseInt(req.query.deviceId as string) : null;
      const actionType = req.query.actionType as string || null;
      
      // Get logs
      const logs = await DeviceModel.getAllDeviceLogs(deviceId, actionType, limit, offset);
      
      // Format the response
      const formattedLogs = logs.map((log: DeviceLog) => {
        // Format timestamp for frontend
        const logTime = new Date(log.log_time);
        
        // Calculate time difference for displaying "X time ago"
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - logTime.getTime()) / (1000 * 60));
        
        let timeAgo;
        if (diffMinutes < 1) {
          timeAgo = 'Just now';
        } else if (diffMinutes === 1) {
          timeAgo = '1 min ago';
        } else if (diffMinutes < 60) {
          timeAgo = `${diffMinutes} mins ago`;
        } else {
          const hours = Math.floor(diffMinutes / 60);
          if (hours === 1) {
            timeAgo = '1 hour ago';
          } else if (hours < 24) {
            timeAgo = `${hours} hours ago`;
          } else {
            const days = Math.floor(hours / 24);
            if (days === 1) {
              timeAgo = '1 day ago';
            } else {
              timeAgo = `${days} days ago`;
            }
          }
        }
        
        // Format action type for better readability
        let actionDisplay = '';
        if (log.action_type === 'value_change') {
          actionDisplay = 'Value updated';
        } else if (log.action_type === 'status_change') {
          actionDisplay = 'Status changed';
        }
        
        return {
          ...log,
          timeAgo,
          actionDisplay,
          formattedTime: logTime.toLocaleString()
        };
      });
      
      res.status(200).json({
        logs: formattedLogs,
        total: formattedLogs.length,
        limit,
        offset
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error when fetching device logs' });
    }
  },
  
  /**
   * Get device logs with optional filtering
   * @route GET /api/devices/:id/logs
   * @access Public
   */
  getDeviceLogs: async (req: Request, res: Response): Promise<void> => {
    try {
      const deviceId = parseInt(req.params.id);
      
      if (isNaN(deviceId)) {
        res.status(400).json({ message: 'Invalid device ID' });
        return;
      }
      
      // Check if device exists
      const device = await DeviceModel.getDeviceById(deviceId);
      if (!device) {
        res.status(404).json({ message: 'Device not found' });
        return;
      }
      
      // Get pagination parameters if any
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get logs
      const logs = await DeviceModel.getDeviceLogs(deviceId, limit, offset);
      
      // Format the response
      const formattedLogs = logs.map(log => {
        // Format timestamp for frontend
        const logTime = new Date(log.log_time);
        
        // Calculate time difference for displaying "X time ago"
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - logTime.getTime()) / (1000 * 60));
        
        let timeAgo;
        if (diffMinutes < 1) {
          timeAgo = 'Just now';
        } else if (diffMinutes === 1) {
          timeAgo = '1 min ago';
        } else if (diffMinutes < 60) {
          timeAgo = `${diffMinutes} mins ago`;
        } else {
          const hours = Math.floor(diffMinutes / 60);
          if (hours === 1) {
            timeAgo = '1 hour ago';
          } else if (hours < 24) {
            timeAgo = `${hours} hours ago`;
          } else {
            const days = Math.floor(hours / 24);
            if (days === 1) {
              timeAgo = '1 day ago';
            } else {
              timeAgo = `${days} days ago`;
            }
          }
        }
        
        // Format action type for better readability
        let actionDisplay = '';
        if (log.action_type === 'value_change') {
          actionDisplay = 'Value updated';
        } else if (log.action_type === 'status_change') {
          actionDisplay = 'Status changed';
        }
        
        return {
          ...log,
          timeAgo,
          actionDisplay,
          formattedTime: logTime.toLocaleString()
        };
      });
      
      res.status(200).json({
        logs: formattedLogs,
        total: formattedLogs.length,
        limit,
        offset
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error when fetching device logs' });
    }
  },
  

  // Helper function to determine icon type based on device name
  getIconType(deviceName: string): string {
    if (deviceName.includes('temperature')) return 'temperature';
    if (deviceName.includes('humidity')) return 'humidity';
    if (deviceName.includes('water') || deviceName.includes('pump')) return 'water';
    if (deviceName.includes('light') || deviceName.includes('led')) return 'light';
    if (deviceName.includes('fan') || deviceName.includes('ventilation')) return 'fan';
    if (deviceName.includes('co2')) return 'humidity'; // Using humidity icon for CO2
    if (deviceName.includes('proximity') || deviceName.includes('pir')) return 'humidity'; // Default to humidity icon
    
    // Default icon
    return 'light';
  },

  // Helper function to determine unit based on device name
  getUnit(deviceName: string): string | undefined {
    if (deviceName.includes('temperature')) return '°C';
    if (deviceName.includes('humidity')) return '%';
    if (deviceName.includes('light')) return 'lux';
    if (deviceName.includes('co2')) return 'ppm';
    
    // No unit for actuators and other sensors
    return undefined;
  }
};
