const express = require('express');
const router = express.Router();
const routineController = require('../controllers/routineController');
const { verificarToken, checkAdmin } = require('../middlewares/authGuard');

// Administrador criar Rotina Modelo
router.post('/', verificarToken, checkAdmin, routineController.createRoutine);

// Administrador ou Paciente lista Rotinas Modelos
router.get('/', verificarToken, routineController.getAllRoutines);

module.exports = router;
