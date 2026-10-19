import { Router } from 'express';
import { positionsController } from './positions.controller';

const router = Router();

router.get('/', positionsController.getPositions.bind(positionsController));
router.get('/:id', positionsController.getPositionById.bind(positionsController));
router.post('/', positionsController.createPosition.bind(positionsController));
router.put('/:id', positionsController.updatePosition.bind(positionsController));
router.delete('/:id', positionsController.deletePosition.bind(positionsController));

export default router;
