const express = require("express");
const router = express.Router();
const tipController = require("../controllers/tipController");
const { verificarToken, checkAdmin } = require("../middlewares/authGuard");
const { validateRequest } = require('../middlewares/validateRequest');
const { tipSchema } = require('../utils/validators');

// Público (Para o app do paciente)
router.get("/", verificarToken, tipController.getTips);

// Privado (Para o painel do admin)
router.post("/", verificarToken, checkAdmin, validateRequest(tipSchema), tipController.createTip);
router.put("/:id", verificarToken, checkAdmin, validateRequest(tipSchema), tipController.updateTip);
router.delete("/:id", verificarToken, tipController.deleteTip);

module.exports = router;
