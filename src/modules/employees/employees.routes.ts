import { Router } from 'express';
import { employeesController } from './employees.controller';
import { validate } from '../../middleware/validate';
import { CreateEmployeeSchema, UpdateEmployeeSchema } from './employees.schema';

const router = Router();

// Specialized endpoints before parameterized :id
router.get('/stats', employeesController.getStats.bind(employeesController));
router.post('/import', employeesController.importEmployees.bind(employeesController));
router.post('/bulk-delete', employeesController.bulkDeleteEmployees.bind(employeesController));
router.delete('/all', employeesController.deleteAllEmployees.bind(employeesController));

// Standard CRUD endpoints
router.get('/', employeesController.getEmployees.bind(employeesController));
router.get('/:id', employeesController.getEmployeeById.bind(employeesController));
router.post('/', validate(CreateEmployeeSchema), employeesController.createEmployee.bind(employeesController));
router.put('/:id', validate(UpdateEmployeeSchema), employeesController.updateEmployee.bind(employeesController));
router.delete('/:id', employeesController.deleteEmployee.bind(employeesController));

export default router;
