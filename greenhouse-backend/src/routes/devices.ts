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
 * @route   GET /api/devices/:id
 * @desc    Get single device
 * @access  Public
 */
router.get('/:id', deviceController.getDeviceById);

/**
 * @route   GET /api/devices/logs
 * @desc    Get all device logs
 * @access  Public
 */
router.get('/logs', deviceController.getAllDeviceLogs);

/**
 * @route   GET /api/devices/:id/logs
 * @desc    Get device logs for specific device
 * @access  Public
 */
router.get('/:id/logs', deviceController.getDeviceLogs);

/**
 * @route   PUT /api/public/devices/:id/toggle
 * @desc    Toggle device status (for actuators) - Public endpoint for development
 * @access  Public
 */
router.put('/public/:id/toggle', deviceController.toggleDevice);

/**
 * @route   PUT /api/devices/:id/toggle
 * @desc    Toggle device status (for actuators)
 * @access  Private
 */
router.put('/:id/toggle', authenticateJWT, deviceController.toggleDevice);

/**
 * @route   PUT /api/devices/:id/value
 * @desc    Update device sensor value
 * @access  Private
 */
router.put('/:id/value', authenticateJWT, deviceController.updateSensorValue);

export default router;
