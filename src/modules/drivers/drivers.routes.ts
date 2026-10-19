import { Router } from 'express';
import { driversController } from './drivers.controller';
import { validate } from '../../middleware/validate';
import { CreateDriverSchema, UpdateDriverSchema } from './drivers.schema';

const router = Router();

router.get('/', driversController.getDrivers.bind(driversController));
router.get('/:id', driversController.getDriverById.bind(driversController));
router.post('/', validate(CreateDriverSchema), driversController.createDriver.bind(driversController));
router.put('/:id', validate(UpdateDriverSchema), driversController.updateDriver.bind(driversController));
router.delete('/:id', driversController.deleteDriver.bind(driversController));

export default router;
