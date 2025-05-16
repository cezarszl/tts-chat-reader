import { Router } from 'express';
import whatsappRoutes from './whatsapp';
import signalRoutes from './signal';

const router = Router();

router.use('/whatsapp', whatsappRoutes);
router.use('/signal', signalRoutes);

export default router;
