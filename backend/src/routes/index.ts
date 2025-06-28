import { Router } from 'express';
import whatsappRoutes from './whatsapp';
import signalRoutes from './signal';
import ttsRoutes from './tts';

const router = Router();

router.use('/whatsapp', whatsappRoutes);
router.use('/signal', signalRoutes);
router.use('/tts', ttsRoutes);

export default router;
