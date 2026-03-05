const db = require("../config/database");

const InformeFinalCamada = {
  getCamadaBaseByUser: (idCamada, idUsuario, callback) => {
    const query = `
      SELECT
        d.id_camada,
        d.id_usuario,
        d.fecha_llegada,
        d.peso_promedio,
        d.galpon,
        c.nombre_camada
      FROM datos_iniciales_pollos d
      INNER JOIN camada_pollos c ON c.id_camada = d.id_camada
      WHERE d.id_camada = ?
        AND d.id_usuario = ?
      ORDER BY d.created_at DESC
      LIMIT 1
    `;

    db.query(query, [idCamada, idUsuario], callback);
  },

  getSeguimientosByCamadaAndUser: (idCamada, idUsuario, callback) => {
    const query = `
      SELECT
        id_seguimiento,
        fecha_registro,
        cantidad_aves,
        mortalidad,
        peso_promedio,
        consumo_alimento_kg,
        observaciones
      FROM seguimiento_diario_camadas
      WHERE id_camada = ?
        AND id_usuario = ?
      ORDER BY fecha_registro ASC, id_seguimiento ASC
    `;

    db.query(query, [idCamada, idUsuario], callback);
  },

  create: (data, callback) => {
    const query = `
      INSERT INTO informe_final_camada (
        id_usuario,
        id_camada,
        nombre_camada,
        galpon,
        fecha_llegada,
        fecha_cierre,
        total_dias,
        aves_iniciales,
        aves_finales,
        mortalidad_total,
        peso_inicial,
        peso_final,
        ganancia_peso,
        consumo_total_alimento,
        indice_conversion,
        observaciones
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.id_usuario,
      data.id_camada,
      data.nombre_camada,
      data.galpon,
      data.fecha_llegada,
      data.fecha_cierre,
      data.total_dias,
      data.aves_iniciales,
      data.aves_finales,
      data.mortalidad_total,
      data.peso_inicial,
      data.peso_final,
      data.ganancia_peso,
      data.consumo_total_alimento,
      data.indice_conversion,
      data.observaciones,
    ];

    db.query(query, values, callback);
  },

  getAllByUser: (idUsuario, callback) => {
    const query = `
      SELECT
        id_informe,
        id_usuario,
        id_camada,
        nombre_camada,
        galpon,
        fecha_llegada,
        fecha_cierre,
        total_dias,
        aves_iniciales,
        aves_finales,
        mortalidad_total,
        peso_inicial,
        peso_final,
        ganancia_peso,
        consumo_total_alimento,
        indice_conversion,
        observaciones,
        created_at
      FROM informe_final_camada
      WHERE id_usuario = ?
      ORDER BY created_at DESC
    `;

    db.query(query, [idUsuario], callback);
  },

  deleteByIdAndUser: (idInforme, idUsuario, callback) => {
    const query = `
      DELETE FROM informe_final_camada
      WHERE id_informe = ?
        AND id_usuario = ?
    `;

    db.query(query, [idInforme, idUsuario], callback);
  },
};

module.exports = InformeFinalCamada;
