const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { verificarToken, checkAdmin } = require('../middlewares/authGuard');
const { validateRequest } = require('../middlewares/validateRequest');
const { exerciseSchema } = require('../utils/validators');
const multer = require('multer');

// Usamos memory storage pois a imagem irá direto para o Vercel Blob
const upload = multer({ storage: multer.memoryStorage() });

// Todos que tem Token de acesso (Pacientes e Admins) podem ver a lista de exercícios
router.get('/', verificarToken, exerciseController.getAllExercises);

// Listar imagens locais disponíveis (legado)
router.get('/imagens', verificarToken, checkAdmin, exerciseController.listLocalImages);

// Rota para upload da foto para o Vercel Blob
router.post('/upload', verificarToken, checkAdmin, upload.single('image'), exerciseController.uploadImage);

// APENAS ADMs: Criar, Editar e Deletar
router.post('/', verificarToken, checkAdmin, validateRequest(exerciseSchema), exerciseController.createExercise);
router.put('/:id', verificarToken, checkAdmin, validateRequest(exerciseSchema), exerciseController.updateExercise);
router.delete('/:id', verificarToken, checkAdmin, exerciseController.deleteExercise);

module.exports = router;
