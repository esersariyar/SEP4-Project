-- Greenhouse Monitoring System Database Setup

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS greenhouse;
USE greenhouse;

-- Create sensor data table
CREATE TABLE IF NOT EXISTS sensor_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  temperature DECIMAL(5,2) NOT NULL,
  humidity DECIMAL(5,2) NOT NULL,
  air_humidity DECIMAL(5,2) NOT NULL,
  soil_humidity DECIMAL(5,2) NOT NULL,
  co2_level DECIMAL(5,2) NOT NULL,
  light_lux DECIMAL(8,2) NOT NULL DEFAULT 0,
  prediction ENUM('Normal', 'Warning', 'Alert') NOT NULL DEFAULT 'Normal',
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add light_lux column if it doesn't exist
ALTER TABLE sensor_data
ADD COLUMN IF NOT EXISTS light_lux DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER co2_level;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(64) NOT NULL,
  first_name VARCHAR(50) DEFAULT NULL,
  last_name VARCHAR(50) DEFAULT NULL,
  ref_code CHAR(8) NOT NULL UNIQUE,
  invited_by INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Helper function to generate a random reference code (8 characters)
DELIMITER //
CREATE FUNCTION IF NOT EXISTS generate_ref_code() RETURNS CHAR(8)
BEGIN
  DECLARE code CHAR(8);
  DECLARE done INT DEFAULT 0;
  
  WHILE NOT done DO
    -- Generate an 8-character alphanumeric reference code
    SET code = UPPER(
      CONCAT(
        SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', FLOOR(1 + RAND() * 36), 1),
        SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', FLOOR(1 + RAND() * 36), 1),
        SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', FLOOR(1 + RAND() * 36), 1),
        SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', FLOOR(1 + RAND() * 36), 1),
        SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', FLOOR(1 + RAND() * 36), 1),
        SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', FLOOR(1 + RAND() * 36), 1),
        SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', FLOOR(1 + RAND() * 36), 1),
        SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', FLOOR(1 + RAND() * 36), 1)
      )
    );
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE ref_code = code) THEN
      SET done = 1;
    END IF;
  END WHILE;
  
  RETURN code;
END //
DELIMITER ;

-- Insert initial admin user if table is empty
INSERT INTO users (username, password, first_name, last_name, ref_code)
SELECT 
  'admin',
  SHA2('admin123', 256),
  'System',
  'Administrator',
  'ADMIN123'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users);

-- Add some initial sensor data for testing
INSERT INTO sensor_data (temperature, humidity, prediction, timestamp)
VALUES 
  (23.5, 55.2, 'Normal', NOW() - INTERVAL 24 HOUR),
  (24.1, 56.8, 'Normal', NOW() - INTERVAL 23 HOUR),
  (24.8, 58.3, 'Normal', NOW() - INTERVAL 22 HOUR),
  (25.2, 59.7, 'Normal', NOW() - INTERVAL 21 HOUR),
  (25.9, 61.2, 'Normal', NOW() - INTERVAL 20 HOUR),
  (26.3, 62.8, 'Normal', NOW() - INTERVAL 19 HOUR),
  (26.8, 64.3, 'Normal', NOW() - INTERVAL 18 HOUR),
  (27.2, 65.1, 'Warning', NOW() - INTERVAL 17 HOUR),
  (27.8, 66.3, 'Warning', NOW() - INTERVAL 16 HOUR),
  (28.1, 67.2, 'Warning', NOW() - INTERVAL 15 HOUR),
  (28.7, 68.0, 'Alert', NOW() - INTERVAL 14 HOUR),
  (28.9, 68.5, 'Alert', NOW() - INTERVAL 13 HOUR),
  (28.5, 67.8, 'Warning', NOW() - INTERVAL 12 HOUR),
  (28.0, 66.9, 'Warning', NOW() - INTERVAL 11 HOUR),
  (27.5, 65.4, 'Warning', NOW() - INTERVAL 10 HOUR),
  (26.9, 63.8, 'Normal', NOW() - INTERVAL 9 HOUR),
  (26.2, 62.1, 'Normal', NOW() - INTERVAL 8 HOUR),
  (25.6, 60.5, 'Normal', NOW() - INTERVAL 7 HOUR),
  (24.9, 58.7, 'Normal', NOW() - INTERVAL 6 HOUR),
  (24.3, 57.2, 'Normal', NOW() - INTERVAL 5 HOUR),
  (23.8, 56.1, 'Normal', NOW() - INTERVAL 4 HOUR),
  (23.4, 55.0, 'Normal', NOW() - INTERVAL 3 HOUR),
  (23.1, 54.2, 'Normal', NOW() - INTERVAL 2 HOUR),
  (23.0, 53.8, 'Normal', NOW() - INTERVAL 1 HOUR),
  (22.8, 53.5, 'Normal', NOW());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_ref_code ON users(ref_code); 