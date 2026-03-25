import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { onboardingSchema, updateProfileSchema, driverProfileSchema } from '@poolify/shared';
import * as UsersController from '../controllers/users.controller';

const router = Router();

router.use(authenticate);

router.get('/me', UsersController.getMe);
router.patch('/me', validateBody(updateProfileSchema), UsersController.updateMe);
router.post('/me/onboarding', validateBody(onboardingSchema), UsersController.completeOnboarding);
router.patch(
  '/me/driver-profile',
  validateBody(driverProfileSchema),
  UsersController.updateDriverProfile
);
router.get('/:id', UsersController.getUser);

export default router;
