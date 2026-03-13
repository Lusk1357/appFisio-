const express = require("express");
const router = express.Router();
const tipController = require("../controllers/tipController");
const { verificarToken, checkAdmin } = require("../middlewares/authGuard");

// Público (Para o app do paciente)
router.get("/", verificarToken, tipController.getTips);

// Privado (Para o painel do admin)
router.post("/", verificarToken, tipController.createTip);
router.put("/:id", verificarToken, tipController.updateTip);
router.delete("/:id", verificarToken, tipController.deleteTip);

module.exports = router;
