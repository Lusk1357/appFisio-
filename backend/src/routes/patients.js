const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verificarToken, checkAdmin } = require('../middlewares/authGuard');
const { validateRequest } = require('../middlewares/validateRequest');
const { profileUpdateSchema } = require('../utils/validators');

// Admins listam todos
router.get('/', verificarToken, checkAdmin, patientController.getAllPatients);

// O próprio paciente consultando e alterando seus dados
router.get('/me', verificarToken, patientController.getMe);
router.put('/me', verificarToken, validateRequest(profileUpdateSchema), patientController.updateMe);

// Retorna detalhes de um paciente (Pacientes consultando a si mesmos, ou Admins consultando qualquer um)
router.get('/:id', verificarToken, patientController.getPatientById);

// Admin atualiza dados de um paciente
router.put('/:id', verificarToken, checkAdmin, validateRequest(profileUpdateSchema), patientController.updatePatient);

// Admin exclui um paciente
router.delete('/:id', verificarToken, checkAdmin, patientController.deletePatient);

module.exports = router;
