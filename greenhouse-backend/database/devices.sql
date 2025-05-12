-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('sensor', 'actuator') NOT NULL,
  status ENUM('Normal', 'Active', 'Inactive', 'Warning', 'Alert') NOT NULL DEFAULT 'Normal',
  creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_device_type (type),
  INDEX idx_device_status (status)
);

-- Insert sample devices
INSERT INTO devices (name, type, status)
VALUES 
  ('Temperature Sensor 1', 'sensor', 'Normal'),
  ('Humidity Sensor 1', 'sensor', 'Normal'),
  ('Ventilation Fan', 'actuator', 'Active'),
  ('Water Pump', 'actuator', 'Inactive'),
  ('LED Grow Lights', 'actuator', 'Active');

-- Create device logs table
CREATE TABLE IF NOT EXISTS device_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  user_id INT,
  username VARCHAR(50),
  action_type ENUM('value_change', 'status_change') NOT NULL,
  old_value VARCHAR(100),
  new_value VARCHAR(100) NOT NULL,
  log_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_id (device_id),
  INDEX idx_log_time (log_time)
);
