const Usuario = require("../models/usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.createUsuario = (req, res) => {
  const password = String(req.body.password || "");

  if (password.length < 8) {
    return res.status(400).json({
      message: "La contrasena debe tener al menos 8 caracteres.",
    });
  }

  const nuevoUsuario = {
    nombre_completo: String(req.body.nombre_completo || "").trim(),
    correo_electronico: String(req.body.correo_electronico || "")
      .trim()
      .toLowerCase(),
    numero_de_telefono: String(req.body.numero_de_telefono || "").trim(),
  };

  if (
    !nuevoUsuario.nombre_completo ||
    !nuevoUsuario.correo_electronico ||
    !nuevoUsuario.numero_de_telefono
  ) {
    return res.status(400).json({
      message: "Nombre, correo, telefono y contrasena son obligatorios.",
    });
  }

  Usuario.findByEmail(nuevoUsuario.correo_electronico, (findErr, rows) => {
    if (findErr) {
      console.error("Error finding usuario by email:", findErr);
      return res.status(500).json({ message: "Error creando usuario" });
    }

    if (rows && rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Este correo ya esta registrado." });
    }

    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error("Error hashing password:", hashErr);
        return res.status(500).json({ message: "Error creando usuario" });
      }

      Usuario.create(
        {
          ...nuevoUsuario,
          password_hash: hashedPassword,
        },
        (err, result) => {
          if (err) {
            console.error("Error creating usuario:", err);
            return res.status(500).json({ message: "Error creando usuario" });
          }

          return res.status(201).json({
            message: "Usuario creado correctamente",
            id: result.insertId,
          });
        },
      );
    });
  });
};

exports.loginUsuario = (req, res) => {
  const correoElectronico = String(req.body.correo_electronico || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  if (!correoElectronico || !password) {
    return res.status(400).json({
      message: "Debes enviar correo_electronico y password",
    });
  }

  Usuario.findByEmail(correoElectronico, (err, results) => {
    if (err) {
      console.error("Error login usuario:", err);
      return res.status(500).json({ message: "Error en login de usuario" });
    }

    if (!results || results.length === 0) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const usuario = results[0];

    bcrypt.compare(password, usuario.password_hash || "", (compareErr, ok) => {
      if (compareErr) {
        console.error("Error comparing password:", compareErr);
        return res.status(500).json({ message: "Error en login de usuario" });
      }

      if (!ok) {
        return res.status(401).json({ message: "Credenciales invalidas" });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          correo_electronico: usuario.correo_electronico,
        },
        process.env.JWT_SECRET || "dev-secret",
        { expiresIn: "10h" },
      );

      return res.status(200).json({
        message: "Login exitoso",
        token,
        usuario: {
          id: usuario.id,
          nombre_completo: usuario.nombre_completo,
          correo_electronico: usuario.correo_electronico,
          numero_de_telefono: usuario.numero_de_telefono,
        },
      });
    });
  });
};

exports.getPerfil = (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  Usuario.findPublicById(userId, (err, rows) => {
    if (err) {
      console.error("Error getting perfil:", err);
      return res.status(500).json({ message: "Error obteniendo perfil" });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json(rows[0]);
  });
};

exports.getAllUsuarios = (req, res) => {
  return res.status(403).json({
    message: "Operacion no permitida por seguridad.",
  });
};
exports.updateUsuario = (req, res) => {
  const id = req.params.id; // <--- Rescatamos el ID de la URL
  const datosNuevos = req.body; // <--- Rescatamos lo que el usuario escribió

  // Pasamos el ID y los datos al modelo en ese orden
  Usuario.update(id, datosNuevos, (err, results) => {
    if (err) {
      console.error("Error al actualizar usuario:", err);
      return res.status(500).send("Error al actualizar usuario");
    }
    res.status(200).json({ message: "Usuario actualizado con éxito", results });
  });
};

exports.deleteUsuario = (req, res) => {
  const id = req.params.id;

  Usuario.delete(id, (err, results) => {
    if (err) {
      console.error("Error al eliminar usuario:", err);
      return res.status(500).send("Error al eliminar usuario");
    }
    res.status(200).json({ message: "Usuario eliminado con éxito", results });
  });
};
