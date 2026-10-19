import { Router } from 'express';
import { insuranceController } from './insurance.controller';

const router = Router();

// Stats
router.get('/stats', insuranceController.getInsuranceStats.bind(insuranceController));

// Social Insurance Deletes (must be before parameterized :id)
router.delete('/social/all', insuranceController.deleteAllSocial.bind(insuranceController));
router.post('/social/bulk-delete', insuranceController.bulkDeleteSocial.bind(insuranceController));
router.delete('/social/:id', insuranceController.deleteSocial.bind(insuranceController));

// Social Insurance
router.get('/social', insuranceController.getSocialInsurance.bind(insuranceController));
router.post('/social/import', insuranceController.importSocialInsurance.bind(insuranceController));

// Missing Documents Deletes (must be before parameterized :id)
router.delete('/missing-documents/all', insuranceController.deleteAllMissingDocuments.bind(insuranceController));
router.post('/missing-documents/bulk-delete', insuranceController.bulkDeleteMissingDocuments.bind(insuranceController));
router.delete('/missing-documents/:id', insuranceController.deleteMissingDocument.bind(insuranceController));

// Missing Documents
router.get('/missing-documents', insuranceController.getMissingDocuments.bind(insuranceController));
router.post('/missing-documents/import', insuranceController.importMissingDocuments.bind(insuranceController));
router.patch('/missing-documents/:id', insuranceController.toggleMissingDocument.bind(insuranceController));
router.patch('/missing-documents/:id/toggle', insuranceController.toggleMissingDocument.bind(insuranceController));

export default router;
