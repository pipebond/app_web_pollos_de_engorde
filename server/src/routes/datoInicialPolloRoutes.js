const express = require("express");
const router = express.Router();
const datoInicialPolloController = require("../controllers/datoInicialPolloController");

// Crear un registro de datos iniciales por camada y usuario.
router.post("/", datoInicialPolloController.createDatoInicial);

// Obtener el historial de datos iniciales.
router.get("/", datoInicialPolloController.getAllDatosIniciales);

// Obtener resumen para tarjetas de dashboard.
router.get("/dashboard", datoInicialPolloController.getDashboardDatosIniciales);

// Dashboard con todas las camadas historicas.
router.get(
  "/camadas-dashboard",
  datoInicialPolloController.getCamadasDashboard,
);

// Listar seguimientos diarios de una camada.
router.get(
  "/camadas/:idCamada/seguimientos",
  datoInicialPolloController.getSeguimientosByCamada,
);

// Crear seguimiento diario para una camada.
router.post(
  "/camadas/:idCamada/seguimientos",
  datoInicialPolloController.createSeguimientoDiario,
);

// Actualizar un seguimiento diario existente.
router.put(
  "/seguimientos/:idSeguimiento",
  datoInicialPolloController.updateSeguimientoDiario,
);

module.exports = router;
