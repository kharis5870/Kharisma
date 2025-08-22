import { Router } from 'express';
import {
  getAllMasterPPL,
  createMasterPPL,
  updateMasterPPL,
  deleteMasterPPL,
} from '../services/pplService';

const router = Router();

// GET all master PPL
router.get('/', async (_req, res) => {
  try {
    const pplList = await getAllMasterPPL();
    res.json(pplList);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching PPL list' });
  }
});

// POST new master PPL
router.post('/', async (req, res) => {
  try {
    const newPPL = await createMasterPPL(req.body);
    res.status(201).json(newPPL);
  } catch (error) {
    console.error("CREATE PPL ERROR:", error);
    res.status(500).json({ message: 'Error creating PPL' });
  }
});

// PUT update master PPL
router.put('/:id', async (req, res) => {
    try {
        const updatedPPL = await updateMasterPPL(req.params.id, req.body);
        res.json(updatedPPL);
    } catch (error) {
        console.error("UPDATE PPL ERROR:", error);
        res.status(500).json({ message: 'Error updating PPL' });
    }
});

// DELETE master PPL
router.delete('/:id', async (req, res) => {
    try {
        const success = await deleteMasterPPL(req.params.id);
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'PPL not found for deletion' });
        }
    } catch (error) {
        console.error("DELETE PPL ERROR:", error);
        res.status(500).json({ message: 'Error deleting PPL' });
    }
});

export default router;
