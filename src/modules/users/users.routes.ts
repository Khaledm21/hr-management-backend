import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Protect all users routes with JWT authentication
router.use(authenticateToken);

// RBAC Permissions routes (must precede /:id)
router.get('/roles/permissions', (req, res, next) => usersController.getRolePermissions(req, res, next));
router.put('/roles/permissions/:role', (req, res, next) => usersController.updateRolePermissions(req, res, next));

// Users CRUD routes
router.get('/', (req, res, next) => usersController.getUsers(req, res, next));
router.get('/:id', (req, res, next) => usersController.getUserById(req, res, next));
router.post('/', (req, res, next) => usersController.createUser(req, res, next));
router.put('/:id', (req, res, next) => usersController.updateUser(req, res, next));
router.delete('/:id', (req, res, next) => usersController.deleteUser(req, res, next));

export default router;
