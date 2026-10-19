import { Router } from 'express';
import { departmentsController } from './departments.controller';

const router = Router();

router.get('/', departmentsController.getDepartments.bind(departmentsController));
router.get('/:id', departmentsController.getDepartmentById.bind(departmentsController));
router.post('/', departmentsController.createDepartment.bind(departmentsController));
router.put('/:id', departmentsController.updateDepartment.bind(departmentsController));
router.delete('/:id', departmentsController.deleteDepartment.bind(departmentsController));

export default router;
