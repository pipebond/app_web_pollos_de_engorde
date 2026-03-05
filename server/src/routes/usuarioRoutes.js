const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const { requireAuth } = require("../middleware/authMiddleware");

// Create a new usuario/ crear usuario
router.post("/", usuarioController.createUsuario);

// Login simple por correo para identificar usuario activo.
router.post("/login", usuarioController.loginUsuario);

// Perfil del usuario autenticado.
router.get("/me", requireAuth, usuarioController.getPerfil);

// Get all usuarios/ optener todos los datos
router.get("/", requireAuth, usuarioController.getAllUsuarios);

// Update usuario by ID/ actualizar usuario por id
router.put("/:id", requireAuth, usuarioController.updateUsuario);

// Delete usuario by ID/ eliminar usuario por id
router.delete("/:id", requireAuth, usuarioController.deleteUsuario);

module.exports = router;
