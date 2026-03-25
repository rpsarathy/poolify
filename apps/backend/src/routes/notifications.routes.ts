import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as NotificationsController from '../controllers/notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', NotificationsController.getNotifications);
router.patch('/read-all', NotificationsController.markAllRead);
router.patch('/:id/read', NotificationsController.markRead);

export default router;
