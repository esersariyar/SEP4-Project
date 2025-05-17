import express from 'express';
import { deviceController } from '../controllers/deviceController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route   GET /api/devices
 * @desc    Get all devices
 * @access  Public
 */
router.get('/', deviceController.getAllDevices);

/**
 * @route   GET /api/devices/test
 * @desc    Test route to verify the router is working
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({ message: 'Device routes are working!' });
});

/**
 * @route   GET /api/devices/logs
 * @desc    Get all device logs with optional filtering
 * @access  Public
 */
router.get('/logs', deviceController.getAllDeviceLogs);

/**
 * @route   GET /api/devices/:id/logs
 * @desc    Get device logs with optional filtering
 * @access  Public
 */
router.get('/:id/logs', deviceController.getDeviceLogs);

/**
 * @route   PUT /api/devices/:id/toggle
 * @desc    Toggle device status (for actuators)
 * @access  Private
 */
router.put('/:id/toggle', authenticateJWT, deviceController.toggleDevice);

/**
 * @route   PUT /api/devices/:id/value
 * @desc    Update sensor value (for sensors like CO2, light/lux etc.)
 * @access  Private
 */
router.put('/:id/value', authenticateJWT, deviceController.updateSensorValue);

export default router;
