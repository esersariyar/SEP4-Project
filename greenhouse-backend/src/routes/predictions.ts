import express, { Request, Response, NextFunction } from 'express';
import predictionController from '../controllers/predictionController';

const router = express.Router();

// Get prediction data
router.get('/', (req: Request, res: Response) => {
  predictionController.getPredictions(req, res);
});

// Generate new prediction data
router.post('/generate', (req: Request, res: Response) => {
  predictionController.generatePredictions(req, res);
});

// Test database connection
router.get('/test-db', (req: Request, res: Response) => {
  predictionController.testDatabaseConnection(req, res);
});

export default router; 
