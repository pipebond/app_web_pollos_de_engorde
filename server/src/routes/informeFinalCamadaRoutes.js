const express = require("express");
const router = express.Router();
const informeFinalCamadaController = require("../controllers/informeFinalCamadaController");

// Genera una vista previa calculada del informe final de una camada.
router.get(
  "/preview/:idCamada",
  informeFinalCamadaController.getPreviewInforme,
);

// Guarda el informe final en base de datos.
router.post("/", informeFinalCamadaController.createInformeFinal);

// Lista informes finales guardados del usuario activo.
router.get("/", informeFinalCamadaController.getInformesByUser);

// Elimina un informe final guardado.
router.delete("/:idInforme", informeFinalCamadaController.deleteInforme);

module.exports = router;
