const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { verificarToken } = require('../middlewares/authGuard');

router.get('/me', verificarToken, achievementController.getMyAchievements);
router.post('/', verificarToken, achievementController.addAchievement);
router.put('/read-all', verificarToken, achievementController.markAllAsRead);
router.delete('/clear-all', verificarToken, achievementController.deleteAllAchievements);
router.delete('/:id', verificarToken, achievementController.deleteAchievement);

module.exports = router;
