import { Request, Response, NextFunction } from 'express';
import { driversService } from './drivers.service';

export class DriversController {
  async getDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const drivers = await driversService.findAll(req.query);
      return res.json({
        success: true,
        data: drivers,
        total: drivers.length,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getDriverById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const driver = await driversService.findById(id);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'السائق غير موجود (Driver not found)',
        });
      }
      return res.json({
        success: true,
        data: driver,
      });
    } catch (err) {
      return next(err);
    }
  }

  async createDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await driversService.create(req.body);
      return res.status(201).json({
        success: true,
        data: driver,
        message: 'تم إضافة السائق بنجاح',
      });
    } catch (err) {
      return next(err);
    }
  }

  async updateDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const driver = await driversService.update(id, req.body);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'السائق غير موجود (Driver not found)',
        });
      }
      return res.json({
        success: true,
        data: driver,
        message: 'تم تحديث بيانات السائق بنجاح',
      });
    } catch (err) {
      return next(err);
    }
  }

  async deleteDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const success = await driversService.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'السائق غير موجود (Driver not found)',
        });
      }
      return res.json({
        success: true,
        message: 'تم حذف السائق بنجاح',
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const driversController = new DriversController();
