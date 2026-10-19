import { Router } from 'express';
import { contractsController } from './contracts.controller';

const router = Router();

router.get('/', contractsController.getContracts.bind(contractsController));
router.get('/:id', contractsController.getContractById.bind(contractsController));
router.post('/', contractsController.createContract.bind(contractsController));

export default router;
