const express = require('express');
const router = express.Router();
const routineController = require('../controllers/routineController');
const { verificarToken, checkAdmin } = require('../middlewares/authGuard');
const { validateRequest } = require('../middlewares/validateRequest');
const { routineSchema } = require('../utils/validators');

// Administrador criar Rotina Modelo
router.post('/', verificarToken, checkAdmin, validateRequest(routineSchema), routineController.createRoutine);

// Administrador ou Paciente lista Rotinas Modelos
router.get('/', verificarToken, routineController.getAllRoutines);

module.exports = router;
