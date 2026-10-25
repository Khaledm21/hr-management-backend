import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Public route: Login
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Protected routes: Current authenticated user & change password
router.get('/me', authenticateToken, (req, res, next) => authController.getCurrentUser(req, res, next));
router.post('/change-password', authenticateToken, (req, res, next) => authController.changePassword(req, res, next));

export default router;
