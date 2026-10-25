import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';

export class UsersController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, role, status } = req.query as {
        search?: string;
        role?: string;
        status?: string;
      };

      const data = await usersService.findAll({ search, role, status });
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await usersService.findById(id);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await usersService.create(req.body);
      return res.status(201).json({
        success: true,
        data,
        message: 'User created successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await usersService.update(id, req.body);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        data,
        message: 'User updated successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const requestingUserEmail = req.user?.email;
      const result = await usersService.delete(id, requestingUserEmail);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await usersService.getRolePermissions();
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async updateRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.params.role as string;
      const permissions = req.body.permissions;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions array is required',
        });
      }

      const data = await usersService.updateRolePermissions(role, permissions);
      return res.status(200).json({
        success: true,
        data,
        message: `Permissions updated successfully for role ${role}`,
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const usersController = new UsersController();
