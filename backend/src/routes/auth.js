const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authGuard');
const { validateRequest } = require('../middlewares/validateRequest');
const { registerSchema, loginSchema } = require('../utils/validators');

// Rota Livre: Qualquer pessoa pode se registrar ou logar
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

// Recuperação de Senha (Sem estar logado)
router.post('/verificar-recuperacao', authController.verifyRecoveryData);
router.post('/nova-senha-recuperacao', authController.resetPasswordDirect);

// Alterar Senha (Logado — Paciente ou Admin)
router.post('/alterar-senha', verificarToken, authController.changePassword);

// Logout acessível para quem está dentro
router.post('/logout', authController.logout);

// Rota de Setup (Escondida e Protegida)
router.post('/setup-super-admin', authController.setupSuperAdmin);

module.exports = router;
