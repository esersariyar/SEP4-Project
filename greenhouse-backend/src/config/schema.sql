-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS greenhouse;

USE greenhouse;

-- Set timezone to Denmark (Europe/Copenhagen)
SET GLOBAL time_zone = 'Europe/Copenhagen';
SET time_zone = 'Europe/Copenhagen';

-- Create sensor data table
CREATE TABLE IF NOT EXISTS sensor_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  temperature DECIMAL(5,2) NOT NULL,
  humidity DECIMAL(5,2) NOT NULL,
  prediction ENUM('Normal', 'Alert', 'Warning') NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp)
);

-- Insert some sample data if needed
INSERT INTO sensor_data (temperature, humidity, prediction, timestamp)
VALUES 
  (23.5, 55.2, 'Normal', DATE_SUB(NOW(), INTERVAL 24 HOUR)),
  (24.2, 57.8, 'Normal', DATE_SUB(NOW(), INTERVAL 22 HOUR)),
  (25.1, 60.3, 'Normal', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
  (26.3, 63.7, 'Warning', DATE_SUB(NOW(), INTERVAL 18 HOUR)),
  (27.2, 65.9, 'Warning', DATE_SUB(NOW(), INTERVAL 16 HOUR)),
  (28.1, 68.5, 'Alert', DATE_SUB(NOW(), INTERVAL 14 HOUR)),
  (27.8, 67.2, 'Warning', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
  (26.5, 65.0, 'Warning', DATE_SUB(NOW(), INTERVAL 10 HOUR)),
  (25.7, 61.3, 'Normal', DATE_SUB(NOW(), INTERVAL 8 HOUR)),
  (24.8, 58.7, 'Normal', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
  (24.2, 56.5, 'Normal', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
  (23.9, 55.8, 'Normal', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (23.7, 55.3, 'Normal', NOW());
