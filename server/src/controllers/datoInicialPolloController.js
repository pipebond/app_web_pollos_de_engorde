const DatoInicialPollo = require("../models/datoInicialPollo");

const getUserIdFromRequest = (req) => {
  const parsed = Number(req.user?.id);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

exports.createDatoInicial = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  const payload = {
    id_usuario: userId,
    nombre_camada: req.body.nombre_camada,
    fecha_llegada: req.body.fecha_llegada,
    peso_promedio: req.body.peso_promedio,
    galpon: req.body.galpon,
  };

  // Validacion basica de campos obligatorios visibles en el formulario.
  if (
    payload.id_usuario === undefined ||
    payload.id_usuario === null ||
    payload.id_usuario === "" ||
    !payload.nombre_camada ||
    !payload.fecha_llegada ||
    payload.peso_promedio === undefined ||
    payload.peso_promedio === null ||
    payload.peso_promedio === "" ||
    !payload.galpon
  ) {
    return res.status(400).json({
      message:
        "Todos los campos son obligatorios para registrar datos iniciales.",
    });
  }

  DatoInicialPollo.create(payload, (err, result) => {
    if (err) {
      console.error("Error creating datos_iniciales_pollos:", err);
      return res
        .status(500)
        .json({ message: "Error creating datos iniciales" });
    }

    return res.status(201).json({
      message: "Datos iniciales registrados con exito",
      id: result.insertId,
    });
  });
};

exports.getAllDatosIniciales = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  DatoInicialPollo.getAll(userId, (err, results) => {
    if (err) {
      console.error("Error getting datos iniciales:", err);
      return res.status(500).json({ message: "Error getting datos iniciales" });
    }

    return res.status(200).json(results);
  });
};

exports.getDashboardDatosIniciales = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  DatoInicialPollo.getDashboard(userId, (err, dashboard) => {
    if (err) {
      console.error("Error getting dashboard de datos iniciales:", err);
      return res
        .status(500)
        .json({ message: "Error getting dashboard de datos iniciales" });
    }

    return res.status(200).json(dashboard);
  });
};

exports.getCamadasDashboard = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  DatoInicialPollo.getCamadasDashboard(userId, (err, results) => {
    if (err) {
      console.error("Error getting camadas dashboard:", err);
      return res
        .status(500)
        .json({ message: "Error getting camadas dashboard" });
    }

    return res.status(200).json(results);
  });
};

exports.getSeguimientosByCamada = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  const idCamada = req.params.idCamada;

  DatoInicialPollo.getSeguimientosByCamada(idCamada, userId, (err, results) => {
    if (err) {
      console.error("Error getting seguimientos de camada:", err);
      return res
        .status(500)
        .json({ message: "Error getting seguimientos de camada" });
    }

    return res.status(200).json(results);
  });
};

exports.createSeguimientoDiario = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  const payload = {
    id_camada: Number(req.params.idCamada),
    fecha_registro: req.body.fecha_registro,
    cantidad_aves: req.body.cantidad_aves,
    mortalidad: req.body.mortalidad ?? 0,
    peso_promedio: req.body.peso_promedio,
    consumo_alimento_kg: req.body.consumo_alimento_kg ?? 0,
    observaciones: req.body.observaciones ?? "",
  };

  if (
    !payload.id_camada ||
    !payload.fecha_registro ||
    payload.cantidad_aves === undefined ||
    payload.cantidad_aves === null ||
    payload.cantidad_aves === "" ||
    payload.peso_promedio === undefined ||
    payload.peso_promedio === null ||
    payload.peso_promedio === ""
  ) {
    return res.status(400).json({
      message:
        "Campos obligatorios: fecha_registro, cantidad_aves y peso_promedio.",
    });
  }

  DatoInicialPollo.createSeguimiento(payload, userId, (err, result) => {
    if (err) {
      if (err.message === "FORBIDDEN_CAMADA") {
        return res
          .status(403)
          .json({ message: "No puedes registrar sobre esta camada" });
      }
      console.error("Error creating seguimiento diario:", err);
      return res
        .status(500)
        .json({ message: "Error creating seguimiento diario" });
    }

    return res.status(201).json({
      message: "Seguimiento diario registrado con exito",
      id: result.insertId,
    });
  });
};

exports.updateSeguimientoDiario = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  const idSeguimiento = req.params.idSeguimiento;
  const payload = {
    fecha_registro: req.body.fecha_registro,
    cantidad_aves: req.body.cantidad_aves,
    mortalidad: req.body.mortalidad ?? 0,
    peso_promedio: req.body.peso_promedio,
    consumo_alimento_kg: req.body.consumo_alimento_kg ?? 0,
    observaciones: req.body.observaciones ?? "",
  };

  if (
    !payload.fecha_registro ||
    payload.cantidad_aves === undefined ||
    payload.cantidad_aves === null ||
    payload.cantidad_aves === "" ||
    payload.peso_promedio === undefined ||
    payload.peso_promedio === null ||
    payload.peso_promedio === ""
  ) {
    return res.status(400).json({
      message:
        "Campos obligatorios: fecha_registro, cantidad_aves y peso_promedio.",
    });
  }

  DatoInicialPollo.updateSeguimiento(
    idSeguimiento,
    payload,
    userId,
    (err, result) => {
      if (err) {
        console.error("Error updating seguimiento diario:", err);
        return res
          .status(500)
          .json({ message: "Error updating seguimiento diario" });
      }

      if (!result.affectedRows) {
        return res
          .status(404)
          .json({ message: "Seguimiento no encontrado para este usuario" });
      }

      return res.status(200).json({
        message: "Seguimiento diario actualizado con exito",
        affectedRows: result.affectedRows,
      });
    },
  );
};
