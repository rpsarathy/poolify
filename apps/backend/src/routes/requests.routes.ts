import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { createRequestSchema } from '@poolify/shared';
import * as RequestsController from '../controllers/requests.controller';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(createRequestSchema), RequestsController.createRequest);
router.get('/incoming', RequestsController.getIncoming);
router.get('/outgoing', RequestsController.getOutgoing);
router.get('/:id', RequestsController.getRequest);
router.patch('/:id/approve', RequestsController.approveRequest);
router.patch('/:id/reject', RequestsController.rejectRequest);
router.patch('/:id/cancel', RequestsController.cancelRequest);

export default router;
