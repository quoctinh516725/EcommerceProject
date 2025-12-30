import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import profileController from '../controllers/profile.controller';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// Profile routes
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/avatar', profileController.updateAvatar);

// Address routes
router.get('/addresses', profileController.getAddresses);
router.post('/addresses', profileController.createAddress);
router.put('/addresses/:id', profileController.updateAddress);
router.delete('/addresses/:id', profileController.deleteAddress);

export default router;


