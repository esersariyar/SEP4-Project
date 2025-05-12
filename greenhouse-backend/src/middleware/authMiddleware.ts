import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();


const JWT_SECRET: Secret = process.env.JWT_SECRET || 'greenhouse-secret-key';

// Define user payload type
interface UserPayload {
  id: number;
  username: string;
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  // Get auth header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'No authentication token provided'
    });
    return;
  }
  
  // Extract token from header
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      message: 'Token format invalid. Use: Bearer [token]'
    });
    return;
  }
  
  const token = parts[1];
  
  // Try to verify token
  try {
    // For debugging: show payload without verification
    const decodedWithoutVerify = jwt.decode(token);
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user in request
    req.user = decoded as UserPayload;
    
    // Continue to next middleware/route handler
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
    return;
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
    return;
  }


  if (req.user.username === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required' 
    });
    return;
  }
}; 