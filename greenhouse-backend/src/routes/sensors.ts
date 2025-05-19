import express, { RequestHandler } from 'express';
import sensorController from '../controllers/sensorController';

const router = express.Router();

// Get current sensor data
router.get('/', sensorController.getCurrentData as RequestHandler);

// Get historical sensor data
router.get('/history', sensorController.getHistoricalData as RequestHandler);

// Create new sensor data entry
router.post('/', sensorController.createSensorData);

// Generate demo data
router.post('/generate-demo', sensorController.generateDemoData);

export default router;
