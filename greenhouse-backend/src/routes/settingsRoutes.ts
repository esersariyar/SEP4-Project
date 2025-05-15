import express from 'express';
import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RowDataPacket } from 'mysql2';

// Extend the Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Define user interface for type safety
interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  password: string;
  refCode: string;
}

const router = express.Router();

// Get JWT secret from environment variables or use a default
const JWT_SECRET = process.env.JWT_SECRET || 'greenhouse-secret-key';

// Helper function to hash a password
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Custom auth middleware specifically for settings routes
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided' 
    });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token'
    });
    return;
  }
};

// Create a settings controller object
const settingsController = {
  // Get user profile data
  getUserProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      
      const [rows] = await pool.query<UserRow[]>(
        'SELECT id, username, first_name as firstName, last_name as lastName, ref_code as refCode FROM users WHERE id = ?',
        [userId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching user profile'
      });
    }
  },
  
  // Update user profile data
  updateUserProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, currentPassword, newPassword } = req.body;
      
      // Validate the input
      if (firstName && typeof firstName !== 'string') {
        res.status(400).json({
          success: false,
          message: 'First name must be a string'
        });
        return;
      }
      
      if (lastName && typeof lastName !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Last name must be a string'
        });
        return;
      }
      
      // Get the current user data
      const [userRows] = await pool.query<UserRow[]>(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );
      
      if (!Array.isArray(userRows) || userRows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }
      
      // If password change is requested, verify the current password
      if (currentPassword && newPassword) {
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
          res.status(400).json({
            success: false,
            message: 'Password must be a string'
          });
          return;
        }
        
        // Check minimum password length
        if (newPassword.length < 6) {
          res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long'
          });
          return;
        }
        
        const hashedCurrentPassword = hashPassword(currentPassword);
        const storedPassword = userRows[0].password;
        
        if (hashedCurrentPassword !== storedPassword) {
          res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
          });
          return;
        }
        
        // Hash the new password
        const hashedNewPassword = hashPassword(newPassword);
        
        // Update the user profile with new password
        await pool.query(
          'UPDATE users SET first_name = ?, last_name = ?, password = ? WHERE id = ?',
          [firstName, lastName, hashedNewPassword, userId]
        );
      } else {
        // Update the user profile without changing the password
        await pool.query(
          'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
          [firstName, lastName, userId]
        );
      }
      
      // Get the updated user data
      const [rows] = await pool.query<UserRow[]>(
        'SELECT id, username, first_name as firstName, last_name as lastName, ref_code as refCode FROM users WHERE id = ?',
        [userId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found after update'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: rows[0]
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating user profile'
      });
    }
  }
};

// Register routes with our custom authenticate middleware
router.get('/', authenticate, settingsController.getUserProfile);
router.put('/', authenticate, settingsController.updateUserProfile);

export default router; 