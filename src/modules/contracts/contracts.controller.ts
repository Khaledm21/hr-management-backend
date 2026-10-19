import { Request, Response, NextFunction } from 'express';
import { contractsService } from './contracts.service';

export class ContractsController {
  async getContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contractsService.findAll(req.query);
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getContractById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await contractsService.findById(id);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Contract not found',
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

  async createContract(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contractsService.create(req.body);
      return res.status(201).json({
        success: true,
        data,
        message: 'Contract created successfully',
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const contractsController = new ContractsController();
