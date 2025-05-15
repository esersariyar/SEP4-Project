import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import deviceRoutes from './routes/devices';
import sensorRoutes from './routes/sensors';
import authRoutes from './routes/authRoutes';
import dataGeneratorService from './services/dataGenerator';
import sensorController from './controllers/sensorController';
import settingsRoutes from './routes/settingsRoutes';

// Configure environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/devices', deviceRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Special routes for testing/development
app.get('/api/generate-data', async (req, res) => {
  try {
    await sensorController.generateDemoData(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Error generating demo data' });
  }
});

// Start data generator service
dataGeneratorService.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  dataGeneratorService.stop();
  process.exit();
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // Server is running
});

export default app;
