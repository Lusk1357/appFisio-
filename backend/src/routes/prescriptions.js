const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { verificarToken, checkAdmin } = require('../middlewares/authGuard');
const { validateRequest } = require('../middlewares/validateRequest');
const { prescriptionSchema } = require('../utils/validators');

// Administrador Associa Treino ao Paciente 
router.post('/admin', verificarToken, checkAdmin, validateRequest(prescriptionSchema), prescriptionController.createPrescription);

// Administrador Busca TODAS as rotinas cadastradas no sistema (Para o Dashboard)
router.get('/admin/all', verificarToken, checkAdmin, prescriptionController.getAllPrescriptions);

// Administrador Busca Treinos de um Paciente Específico (?date=2023-11-20 ou tudo mês)
router.get('/admin/:patientId', verificarToken, checkAdmin, prescriptionController.getPatientPrescriptions);

// Paciente Busca os Treinos Prescritos a Ele Mesmo (?date=2023-11-20)
router.get('/me', verificarToken, prescriptionController.getMyPrescriptions);

// Paciente marca exercícios como concluídos
router.patch('/me/complete', verificarToken, prescriptionController.completeExercises);

// Paciente busca estatísticas de progresso
router.get('/me/stats', verificarToken, prescriptionController.getMyStats);

module.exports = router;
