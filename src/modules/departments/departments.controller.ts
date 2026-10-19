import { Request, Response, NextFunction } from 'express';
import { departmentsService } from './departments.service';

export class DepartmentsController {
  async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await departmentsService.findAll();
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getDepartmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await departmentsService.findById(id);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await departmentsService.create(req.body);
      return res.status(201).json({
        success: true,
        data,
        message: 'Department created successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await departmentsService.update(id, req.body);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }
      return res.json({
        success: true,
        data,
        message: 'Department updated successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const success = await departmentsService.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }
      return res.json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const departmentsController = new DepartmentsController();
