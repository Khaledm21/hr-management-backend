import { Request, Response, NextFunction } from 'express';
import { employeesService } from './employees.service';

export class EmployeesController {
  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeesService.findPaginated(req.query);
      return res.json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getEmployeeById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await employeesService.findById(id);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
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

  async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.create(req.body);
      return res.status(201).json({
        success: true,
        data,
        message: 'Employee created successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await employeesService.update(id, req.body);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
        });
      }
      return res.json({
        success: true,
        data,
        message: 'Employee updated successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const success = await employeesService.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
        });
      }
      return res.json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async bulkDeleteEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = req.body.ids;
      if (!Array.isArray(ids)) {
        return res.status(400).json({
          success: false,
          message: 'Expected ids array in request body',
        });
      }
      const count = await employeesService.bulkDelete(ids);
      return res.json({
        success: true,
        message: `${count} employees deleted successfully`,
        count,
      });
    } catch (err) {
      return next(err);
    }
  }

  async deleteAllEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await employeesService.deleteAll();
      return res.json({
        success: true,
        message: `All employees deleted successfully (${count})`,
        count,
      });
    } catch (err) {
      return next(err);
    }
  }

  async importEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const records = req.body.records || req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({
          success: false,
          message: 'Expected records array in request body',
        });
      }
      const overwrite = Boolean(req.body.overwrite);
      const result = await employeesService.batchImport(records, overwrite);
      return res.json({
        success: true,
        insertedCount: result.insertedCount,
        importedCount: result.insertedCount,
        skippedCount: result.skippedCount,
        errors: result.errors,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.getStats();
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const employeesController = new EmployeesController();
