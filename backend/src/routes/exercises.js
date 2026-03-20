const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { verificarToken, checkAdmin } = require('../middlewares/authGuard');
const { validateRequest } = require('../middlewares/validateRequest');
const { exerciseSchema } = require('../utils/validators');

// Todos que tem Token de acesso (Pacientes e Admins) podem ver a lista de exercícios
router.get('/', verificarToken, exerciseController.getAllExercises);

// Listar imagens locais disponíveis (deve vir ANTES das rotas com :id)
router.get('/imagens', verificarToken, checkAdmin, exerciseController.listLocalImages);

// APENAS ADMs: Criar, Editar e Deletar
router.post('/', verificarToken, checkAdmin, validateRequest(exerciseSchema), exerciseController.createExercise);
router.put('/:id', verificarToken, checkAdmin, validateRequest(exerciseSchema), exerciseController.updateExercise);
router.delete('/:id', verificarToken, checkAdmin, exerciseController.deleteExercise);

module.exports = router;
