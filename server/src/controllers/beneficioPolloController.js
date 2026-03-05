const BeneficioPollo = require("../models/beneficioPollo");

const getUserIdFromRequest = (req) => {
  const parsed = Number(req.user?.id);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

exports.createBeneficio = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  const pesoSacrificado = Number(req.body.peso_sacrificado);

  const payload = {
    id_usuario: userId,
    id_camada: Number(req.body.id_camada),
    peso_en_vivo: req.body.peso_en_vivo,
    peso_sacrificado: req.body.peso_sacrificado,
    // Regla de negocio: precio total = kg sacrificados * 11000.
    precio: Number((pesoSacrificado * 11000).toFixed(2)),
    cantidad_beneficiados: req.body.cantidad_beneficiados,
  };

  if (
    Number.isNaN(payload.id_camada) ||
    payload.id_camada <= 0 ||
    payload.peso_en_vivo === undefined ||
    payload.peso_en_vivo === null ||
    payload.peso_en_vivo === "" ||
    payload.peso_sacrificado === undefined ||
    payload.peso_sacrificado === null ||
    payload.peso_sacrificado === "" ||
    payload.cantidad_beneficiados === undefined ||
    payload.cantidad_beneficiados === null ||
    payload.cantidad_beneficiados === ""
  ) {
    return res.status(400).json({
      message:
        "Debes enviar camada, peso en vivo, peso sacrificado y cantidad beneficiados.",
    });
  }

  BeneficioPollo.userHasCamada(userId, payload.id_camada, (camErr, rows) => {
    if (camErr) {
      console.error("Error validating camada for beneficio:", camErr);
      return res.status(500).json({ message: "Error creando beneficio" });
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({
        message: "La camada seleccionada no pertenece al usuario activo.",
      });
    }

    BeneficioPollo.create(payload, (err, result) => {
      if (err) {
        console.error("Error creating beneficio_pollo:", err);
        return res
          .status(500)
          .json({ message: "Error creating beneficio_pollo" });
      }

      return res.status(201).json({
        message: "Beneficio registrado con exito",
        id: result.insertId,
      });
    });
  });
};

exports.getBeneficiosByUser = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  BeneficioPollo.getAllByUser(userId, (err, results) => {
    if (err) {
      console.error("Error getting beneficio_pollo:", err);
      return res.status(500).json({ message: "Error getting beneficio_pollo" });
    }

    return res.status(200).json(results);
  });
};

exports.updateBeneficio = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  const beneficioId = Number(req.params.id);
  if (Number.isNaN(beneficioId) || beneficioId <= 0) {
    return res.status(400).json({ message: "Id de beneficio invalido." });
  }

  const pesoSacrificado = Number(req.body.peso_sacrificado);

  const payload = {
    id_camada: Number(req.body.id_camada),
    peso_en_vivo: req.body.peso_en_vivo,
    peso_sacrificado: req.body.peso_sacrificado,
    // Regla de negocio: precio total = kg sacrificados * 11000.
    precio: Number((pesoSacrificado * 11000).toFixed(2)),
    cantidad_beneficiados: req.body.cantidad_beneficiados,
  };

  if (
    Number.isNaN(payload.id_camada) ||
    payload.id_camada <= 0 ||
    payload.peso_en_vivo === undefined ||
    payload.peso_en_vivo === null ||
    payload.peso_en_vivo === "" ||
    payload.peso_sacrificado === undefined ||
    payload.peso_sacrificado === null ||
    payload.peso_sacrificado === "" ||
    payload.cantidad_beneficiados === undefined ||
    payload.cantidad_beneficiados === null ||
    payload.cantidad_beneficiados === ""
  ) {
    return res.status(400).json({
      message:
        "Debes enviar camada, peso en vivo, peso sacrificado y cantidad beneficiados.",
    });
  }

  BeneficioPollo.userHasCamada(userId, payload.id_camada, (camErr, rows) => {
    if (camErr) {
      console.error("Error validating camada for beneficio update:", camErr);
      return res.status(500).json({ message: "Error actualizando beneficio" });
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({
        message: "La camada seleccionada no pertenece al usuario activo.",
      });
    }

    BeneficioPollo.updateByIdAndUser(
      beneficioId,
      userId,
      payload,
      (err, result) => {
        if (err) {
          console.error("Error updating beneficio_pollo:", err);
          return res
            .status(500)
            .json({ message: "Error updating beneficio_pollo" });
        }

        if (!result || result.affectedRows === 0) {
          return res
            .status(404)
            .json({ message: "Beneficio no encontrado para este usuario." });
        }

        return res
          .status(200)
          .json({ message: "Beneficio actualizado con exito" });
      },
    );
  });
};

exports.deleteBeneficio = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  const beneficioId = Number(req.params.id);
  if (Number.isNaN(beneficioId) || beneficioId <= 0) {
    return res.status(400).json({ message: "Id de beneficio invalido." });
  }

  BeneficioPollo.deleteByIdAndUser(beneficioId, userId, (err, result) => {
    if (err) {
      console.error("Error deleting beneficio_pollo:", err);
      return res
        .status(500)
        .json({ message: "Error deleting beneficio_pollo" });
    }

    if (!result || result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Beneficio no encontrado para este usuario." });
    }

    return res.status(200).json({ message: "Beneficio eliminado con exito" });
  });
};
