import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sensorRoutes from './routes/sensors';
import authRoutes from './routes/authRoutes';
import settingsRoutes from './routes/settingsRoutes';
import dataGenerator from './services/dataGenerator';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());


app.use('/api/sensors', sensorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
  res.send('Greenhouse Monitoring API is running');
});

// Test endpoint to generate data on demand
app.get('/api/generate-test-data', (req, res) => {
  try {
    console.log('Manual data generation requested');
    dataGenerator.generateOnDemand();
    res.status(200).json({ message: 'Data generation triggered. Check server logs for details.' });
  } catch (error) {
    console.error('Error triggering data generation:', error);
    res.status(500).json({ message: 'Error triggering data generation' });
  }
});

// Explicitly start the data generator
console.log('Starting data generator service from index.ts');
dataGenerator.start();


process.on('SIGINT', () => {
  console.log('Shutting down...');
  dataGenerator.stop();
  process.exit(0);
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
