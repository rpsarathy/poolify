import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery } from '../middleware/validate';
import { createRideSchema, updateRideSchema, rideSearchSchema } from '@poolify/shared';
import * as RidesController from '../controllers/rides.controller';

const router = Router();

router.use(authenticate);

router.get('/search', validateQuery(rideSearchSchema), RidesController.searchRides);
router.get('/', RidesController.getMyRides);
router.post('/', validateBody(createRideSchema), RidesController.createRide);
router.get('/:id', RidesController.getRide);
router.patch('/:id', validateBody(updateRideSchema), RidesController.updateRide);
router.delete('/:id', RidesController.deleteRide);

export default router;
