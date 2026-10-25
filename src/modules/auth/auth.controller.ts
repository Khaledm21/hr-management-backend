import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await authService.getCurrentUser(userId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(userId, currentPassword, newPassword);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const authController = new AuthController();
