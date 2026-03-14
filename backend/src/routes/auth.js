const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota Livre: Qualquer pessoa pode se registrar ou logar
router.post('/register', authController.register);
router.post('/login', authController.login);

// Recuperação de Senha (Sem estar logado)
router.post('/verificar-recuperacao', authController.verifyRecoveryData);
router.post('/nova-senha-recuperacao', authController.resetPasswordDirect);

// Logout acessível para quem está dentro
router.post('/logout', authController.logout);

// Rota de Setup (Escondida e Protegida)
router.post('/setup-super-admin', authController.setupSuperAdmin);

module.exports = router;
