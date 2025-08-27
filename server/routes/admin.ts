import { Router } from 'express';
import * as adminService from '../services/adminService';

const router = Router();

// User routes
router.get('/users', async (_req, res) => res.json(await adminService.getAllUsers()));
router.post('/users', async (req, res) => res.status(201).json(await adminService.createUser(req.body)));
router.put('/users/:id', async (req, res) => res.json(await adminService.updateUser(req.params.id, req.body)));
router.delete('/users/:id', async (req, res) => {
    await adminService.deleteUser(req.params.id);
    res.status(204).send();
});

router.get('/pml', async (_req, res) => res.json(await adminService.getAllPMLs()));

// Ketua Tim routes
router.get('/ketua-tim', async (_req, res) => res.json(await adminService.getAllKetuaTim()));
router.post('/ketua-tim', async (req, res) => res.status(201).json(await adminService.createKetuaTim(req.body)));
router.put('/ketua-tim/:id', async (req, res) => res.json(await adminService.updateKetuaTim(req.params.id, req.body)));
router.delete('/ketua-tim/:id', async (req, res) => {
    await adminService.deleteKetuaTim(req.params.id);
    res.status(204).send();
});

// PPL routes
router.get('/ppl', async (_req, res) => res.json(await adminService.getAllPPLAdmin()));
router.post('/ppl', async (req, res) => res.status(201).json(await adminService.createPPLAdmin(req.body)));
router.put('/ppl/:id', async (req, res) => res.json(await adminService.updatePPLAdmin(req.params.id, req.body)));
router.delete('/ppl/:id', async (req, res) => {
    await adminService.deletePPLAdmin(req.params.id);
    res.status(204).send();
});

export default router;
