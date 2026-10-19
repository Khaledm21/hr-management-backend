import { Router } from 'express';
import { documentsController } from './documents.controller';
import { upload } from '../../middleware/upload';

const router = Router();

// Delete routes (must be before parameterized :id)
router.delete('/all', documentsController.deleteAllDocuments.bind(documentsController));
router.post('/bulk-delete', documentsController.bulkDeleteDocuments.bind(documentsController));
router.delete('/:id', documentsController.deleteDocument.bind(documentsController));

router.get('/', documentsController.getDocuments.bind(documentsController));
router.post('/upload', upload.single('file'), documentsController.createDocument.bind(documentsController));
router.get('/:id', documentsController.getDocumentById.bind(documentsController));
router.post('/', upload.single('file'), documentsController.createDocument.bind(documentsController));
router.post('/:id/verify', documentsController.verifyDocument.bind(documentsController));
router.post('/:id/reject', documentsController.rejectDocument.bind(documentsController));

export default router;
