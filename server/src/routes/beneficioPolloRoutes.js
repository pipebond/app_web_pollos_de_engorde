const express = require("express");
const router = express.Router();
const beneficioPolloController = require("../controllers/beneficioPolloController");

// Registrar beneficio del pollo (por usuario activo).
router.post("/", beneficioPolloController.createBeneficio);

// Listar beneficios del usuario activo.
router.get("/", beneficioPolloController.getBeneficiosByUser);

// Actualizar beneficio del pollo (solo si pertenece al usuario activo).
router.put("/:id", beneficioPolloController.updateBeneficio);

// Eliminar beneficio del pollo (solo si pertenece al usuario activo).
router.delete("/:id", beneficioPolloController.deleteBeneficio);

module.exports = router;
