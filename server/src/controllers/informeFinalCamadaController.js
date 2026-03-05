const InformeFinalCamada = require("../models/informeFinalCamada");

const getUserIdFromRequest = (req) => {
  const parsed = Number(req.user?.id);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const toDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const diffDays = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }
  const ms = endDate.getTime() - startDate.getTime();
  return ms > 0 ? Math.floor(ms / 86400000) : 0;
};

const buildPreview = (base, seguimientos, observaciones = "") => {
  const pesoInicial = Number(base.peso_promedio) || 0;
  const fechaLlegada = toDateOnly(base.fecha_llegada);

  const primerSeguimiento = seguimientos[0] || null;
  const ultimoSeguimiento = seguimientos[seguimientos.length - 1] || null;

  const avesIniciales = primerSeguimiento
    ? Number(primerSeguimiento.cantidad_aves) || 0
    : 0;
  const avesFinales = ultimoSeguimiento
    ? Number(ultimoSeguimiento.cantidad_aves) || 0
    : avesIniciales;

  const mortalidadTotal = seguimientos.reduce(
    (acc, fila) => acc + (Number(fila.mortalidad) || 0),
    0,
  );

  const pesoFinal = ultimoSeguimiento
    ? Number(ultimoSeguimiento.peso_promedio) || 0
    : pesoInicial;

  const gananciaPeso = pesoFinal - pesoInicial;

  const consumoTotalAlimento = seguimientos.reduce(
    (acc, fila) => acc + (Number(fila.consumo_alimento_kg) || 0),
    0,
  );

  const produccionFinalKg = avesFinales * pesoFinal;
  const indiceConversion =
    produccionFinalKg > 0 ? consumoTotalAlimento / produccionFinalKg : 0;

  const fechaCierre = ultimoSeguimiento
    ? toDateOnly(ultimoSeguimiento.fecha_registro)
    : null;

  const totalDias = diffDays(fechaLlegada, fechaCierre || fechaLlegada);

  return {
    id_camada: Number(base.id_camada),
    nombre_camada: base.nombre_camada,
    galpon: base.galpon,
    fecha_llegada: fechaLlegada,
    fecha_cierre: fechaCierre,
    total_dias: totalDias,
    aves_iniciales: avesIniciales,
    aves_finales: avesFinales,
    mortalidad_total: mortalidadTotal,
    peso_inicial: Number(pesoInicial.toFixed(2)),
    peso_final: Number(pesoFinal.toFixed(2)),
    ganancia_peso: Number(gananciaPeso.toFixed(2)),
    consumo_total_alimento: Number(consumoTotalAlimento.toFixed(2)),
    indice_conversion: Number(indiceConversion.toFixed(4)),
    total_registros_diarios: seguimientos.length,
    observaciones,
  };
};

exports.getPreviewInforme = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  const idCamada = Number(req.params.idCamada);
  if (Number.isNaN(idCamada) || idCamada <= 0) {
    return res.status(400).json({ message: "Id de camada invalido." });
  }

  InformeFinalCamada.getCamadaBaseByUser(
    idCamada,
    userId,
    (baseErr, baseRows) => {
      if (baseErr) {
        console.error("Error getting base de camada:", baseErr);
        return res
          .status(500)
          .json({ message: "Error generando informe previo" });
      }

      if (!baseRows || baseRows.length === 0) {
        return res
          .status(404)
          .json({ message: "Camada no encontrada para este usuario." });
      }

      const base = baseRows[0];

      InformeFinalCamada.getSeguimientosByCamadaAndUser(
        idCamada,
        userId,
        (segErr, segRows) => {
          if (segErr) {
            console.error("Error getting seguimientos para informe:", segErr);
            return res
              .status(500)
              .json({ message: "Error generando informe previo" });
          }

          const preview = buildPreview(
            base,
            Array.isArray(segRows) ? segRows : [],
          );
          return res.status(200).json(preview);
        },
      );
    },
  );
};

exports.createInformeFinal = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  const idCamada = Number(req.body.id_camada);
  const observaciones = String(req.body.observaciones || "").trim();

  if (Number.isNaN(idCamada) || idCamada <= 0) {
    return res
      .status(400)
      .json({ message: "Debes enviar un id_camada valido." });
  }

  InformeFinalCamada.getCamadaBaseByUser(
    idCamada,
    userId,
    (baseErr, baseRows) => {
      if (baseErr) {
        console.error("Error getting base de camada:", baseErr);
        return res
          .status(500)
          .json({ message: "Error guardando informe final" });
      }

      if (!baseRows || baseRows.length === 0) {
        return res
          .status(404)
          .json({ message: "Camada no encontrada para este usuario." });
      }

      const base = baseRows[0];

      InformeFinalCamada.getSeguimientosByCamadaAndUser(
        idCamada,
        userId,
        (segErr, segRows) => {
          if (segErr) {
            console.error("Error getting seguimientos para informe:", segErr);
            return res
              .status(500)
              .json({ message: "Error guardando informe final" });
          }

          const payload = {
            id_usuario: userId,
            ...buildPreview(
              base,
              Array.isArray(segRows) ? segRows : [],
              observaciones,
            ),
          };

          InformeFinalCamada.create(payload, (createErr, result) => {
            if (createErr) {
              console.error("Error creating informe_final_camada:", createErr);
              return res
                .status(500)
                .json({ message: "Error guardando informe final" });
            }

            return res.status(201).json({
              message: "Informe final de camada guardado con exito",
              id: result.insertId,
            });
          });
        },
      );
    },
  );
};

exports.getInformesByUser = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  InformeFinalCamada.getAllByUser(userId, (err, rows) => {
    if (err) {
      console.error("Error getting informe_final_camada:", err);
      return res
        .status(500)
        .json({ message: "Error obteniendo informes finales" });
    }

    return res.status(200).json(rows || []);
  });
};

exports.deleteInforme = (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Sesion invalida. Inicia sesion." });
  }

  const idInforme = Number(req.params.idInforme);
  if (Number.isNaN(idInforme) || idInforme <= 0) {
    return res.status(400).json({ message: "Id de informe invalido." });
  }

  InformeFinalCamada.deleteByIdAndUser(idInforme, userId, (err, result) => {
    if (err) {
      console.error("Error deleting informe_final_camada:", err);
      return res
        .status(500)
        .json({ message: "Error eliminando informe final" });
    }

    if (!result || result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Informe no encontrado para este usuario." });
    }

    return res
      .status(200)
      .json({ message: "Informe final eliminado con exito" });
  });
};
