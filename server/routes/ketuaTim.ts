import { Router } from 'express';
import { getAllKetuaTim } from '../services/ketuaTimService';

const router = Router();

// GET all ketua tim
router.get('/', async (_req, res) => {
  try {
    const ketuaTimList = await getAllKetuaTim();
    res.json(ketuaTimList);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ketua tim list' });
  }
});

export default router;
