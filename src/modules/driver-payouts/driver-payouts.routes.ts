import { Router } from 'express';
import { driverPayoutsController } from './driver-payouts.controller';
import { validate } from '../../middleware/validate';
import {
  CreateSummarySchema,
  UpdateSummaryStatusSchema,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  BatchImportSchema,
} from './driver-payouts.schema';

const router = Router();

// --- Batch Import Route (/api/driver-payouts/batch-import) ---
router.post(
  '/batch-import',
  validate(BatchImportSchema),
  driverPayoutsController.batchImport.bind(driverPayoutsController)
);

// --- Weekly Summaries Routes (/api/driver-payouts/summaries) ---
router.get('/summaries', driverPayoutsController.getSummaries.bind(driverPayoutsController));
router.get('/summaries/:weekPeriod', driverPayoutsController.getSummaryByPeriod.bind(driverPayoutsController));
router.post('/summaries', validate(CreateSummarySchema), driverPayoutsController.createSummary.bind(driverPayoutsController));
router.put(
  '/summaries/:weekPeriod/status',
  validate(UpdateSummaryStatusSchema),
  driverPayoutsController.updateSummaryStatus.bind(driverPayoutsController)
);

// --- Transactions Routes (/api/driver-payouts/transactions) ---
router.get('/transactions', driverPayoutsController.getTransactions.bind(driverPayoutsController));
router.post(
  '/transactions',
  validate(CreateTransactionSchema),
  driverPayoutsController.createTransaction.bind(driverPayoutsController)
);
router.put(
  '/transactions/:id',
  validate(UpdateTransactionSchema),
  driverPayoutsController.updateTransaction.bind(driverPayoutsController)
);
router.delete('/transactions/:id', driverPayoutsController.deleteTransaction.bind(driverPayoutsController));

// --- Matrix View Route (/api/driver-payouts/matrix/:weekPeriod) ---
router.get('/matrix/:weekPeriod', driverPayoutsController.getWeeklyMatrix.bind(driverPayoutsController));

export default router;
