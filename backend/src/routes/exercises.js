const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { verificarToken, checkAdmin } = require('../middlewares/authGuard');

// Todos que tem Token de acesso (Pacientes e Admins) podem ver a lista de exercícios
router.get('/', verificarToken, exerciseController.getAllExercises);

// APENAS ADMs: Criar, Editar e Deletar
router.post('/', verificarToken, checkAdmin, exerciseController.createExercise);
router.put('/:id', verificarToken, checkAdmin, exerciseController.updateExercise);
router.delete('/:id', verificarToken, checkAdmin, exerciseController.deleteExercise);

module.exports = router;
