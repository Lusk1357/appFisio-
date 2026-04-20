const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { verificarToken, checkAdmin } = require('../middlewares/authGuard');

router.get('/me', verificarToken, achievementController.getMyAchievements);
router.post('/', verificarToken, achievementController.addAchievement);
router.put('/read-all', verificarToken, achievementController.markAllAsRead);
router.put('/:id/read', verificarToken, achievementController.markOneAsRead);
router.delete('/clear-all', verificarToken, achievementController.deleteAllAchievements);
router.delete('/:id', verificarToken, achievementController.deleteAchievement);

// ADMIN: Enviar notificação direta para um usuário específico
router.post('/admin/:userId', verificarToken, checkAdmin, achievementController.sendDirectNotification);

// ADMIN: Gerenciar Notificações (Histórico)
router.get('/admin/patient/:userId', verificarToken, checkAdmin, achievementController.getAdminNotificationsForPatient);
router.put('/admin/:id', verificarToken, checkAdmin, achievementController.updateAdminNotification);
router.delete('/admin/:id', verificarToken, checkAdmin, achievementController.deleteAdminNotification);

module.exports = router;
