const db = require("../config/database");

const DatoInicialPollo = {
  create: (data, callback) => {
    // Se inserta/obtiene la camada por nombre para mantener la relacion de forma simple.
    const upsertCamadaQuery =
      "INSERT INTO camada_pollos (nombre_camada) VALUES (?) ON DUPLICATE KEY UPDATE id_camada = LAST_INSERT_ID(id_camada)";

    db.query(
      upsertCamadaQuery,
      [data.nombre_camada],
      (camadaErr, camadaResult) => {
        if (camadaErr) {
          callback(camadaErr);
          return;
        }

        const idCamada = camadaResult.insertId;
        const insertDatoQuery =
          "INSERT INTO datos_iniciales_pollos (id_usuario, id_camada, fecha_llegada, peso_promedio, galpon) VALUES (?, ?, ?, ?, ?)";

        const values = [
          data.id_usuario,
          idCamada,
          data.fecha_llegada,
          data.peso_promedio,
          data.galpon,
        ];

        db.query(insertDatoQuery, values, callback);
      },
    );
  },

  getAll: (idUsuario, callback) => {
    const query = `
      SELECT
        d.id_dato_inicial,
        d.fecha_llegada,
        d.peso_promedio,
        d.galpon,
        d.created_at,
        u.id AS id_usuario,
        u.nombre_completo,
        c.id_camada,
        c.nombre_camada
      FROM datos_iniciales_pollos d
      INNER JOIN usuario u ON u.id = d.id_usuario
      INNER JOIN camada_pollos c ON c.id_camada = d.id_camada
      WHERE d.id_usuario = ?
      ORDER BY d.created_at DESC
    `;

    db.query(query, [idUsuario], callback);
  },

  getDashboard: (idUsuario, callback) => {
    const resumenQuery = `
      SELECT
        COUNT(*) AS total_registros,
        COUNT(DISTINCT id_camada) AS total_camadas,
        ROUND(AVG(peso_promedio), 2) AS peso_promedio_general
      FROM datos_iniciales_pollos
      WHERE id_usuario = ?
    `;

    const ultimoRegistroQuery = `
      SELECT
        d.fecha_llegada,
        d.peso_promedio,
        d.galpon,
        c.nombre_camada,
        u.nombre_completo
      FROM datos_iniciales_pollos d
      INNER JOIN camada_pollos c ON c.id_camada = d.id_camada
      INNER JOIN usuario u ON u.id = d.id_usuario
      WHERE d.id_usuario = ?
      ORDER BY d.created_at DESC
      LIMIT 1
    `;

    db.query(resumenQuery, [idUsuario], (resumenErr, resumenRows) => {
      if (resumenErr) {
        callback(resumenErr);
        return;
      }

      db.query(ultimoRegistroQuery, [idUsuario], (ultimoErr, ultimoRows) => {
        if (ultimoErr) {
          callback(ultimoErr);
          return;
        }

        callback(null, {
          resumen: resumenRows[0] || {},
          ultimoRegistro: ultimoRows[0] || null,
        });
      });
    });
  },

  getCamadasDashboard: (idUsuario, callback) => {
    const query = `
      SELECT
        c.id_camada,
        c.nombre_camada,
        di.fecha_llegada,
        di.galpon,
        di.peso_promedio AS peso_inicial,
        COALESCE(sd.total_registros_diarios, 0) AS total_registros_diarios,
        sd.ultima_fecha_registro,
        sd.ultimo_peso_promedio,
        sd.ultima_cantidad_aves,
        sd.ultima_mortalidad
      FROM datos_iniciales_pollos di
      INNER JOIN camada_pollos c ON c.id_camada = di.id_camada
      LEFT JOIN (
        SELECT
          s.id_camada,
          s.id_usuario,
          COUNT(*) AS total_registros_diarios,
          MAX(s.fecha_registro) AS ultima_fecha_registro,
          MAX(CASE WHEN s.fecha_registro = sx.max_fecha THEN s.peso_promedio END) AS ultimo_peso_promedio,
          MAX(CASE WHEN s.fecha_registro = sx.max_fecha THEN s.cantidad_aves END) AS ultima_cantidad_aves,
          MAX(CASE WHEN s.fecha_registro = sx.max_fecha THEN s.mortalidad END) AS ultima_mortalidad
        FROM seguimiento_diario_camadas s
        INNER JOIN (
          SELECT id_camada, id_usuario, MAX(fecha_registro) AS max_fecha
          FROM seguimiento_diario_camadas
          WHERE id_usuario = ?
          GROUP BY id_camada
        ) sx ON sx.id_camada = s.id_camada AND sx.id_usuario = s.id_usuario
        WHERE s.id_usuario = ?
        GROUP BY s.id_camada, s.id_usuario
      ) sd ON sd.id_camada = di.id_camada AND sd.id_usuario = di.id_usuario
      WHERE di.id_usuario = ?
        AND di.created_at = (
          SELECT MAX(d2.created_at)
          FROM datos_iniciales_pollos d2
          WHERE d2.id_camada = di.id_camada
            AND d2.id_usuario = di.id_usuario
        )
      ORDER BY di.created_at DESC
    `;

    db.query(query, [idUsuario, idUsuario, idUsuario], callback);
  },

  getSeguimientosByCamada: (idCamada, idUsuario, callback) => {
    const query = `
      SELECT
        s.id_seguimiento,
        s.id_camada,
        s.fecha_registro,
        s.cantidad_aves,
        s.mortalidad,
        s.peso_promedio,
        s.consumo_alimento_kg,
        s.observaciones,
        s.created_at,
        s.updated_at
      FROM seguimiento_diario_camadas s
      WHERE s.id_camada = ?
        AND s.id_usuario = ?
      ORDER BY s.fecha_registro DESC
    `;

    db.query(query, [idCamada, idUsuario], callback);
  },

  createSeguimiento: (data, idUsuario, callback) => {
    const ownershipQuery =
      "SELECT 1 FROM datos_iniciales_pollos WHERE id_camada = ? AND id_usuario = ? LIMIT 1";

    db.query(
      ownershipQuery,
      [data.id_camada, idUsuario],
      (checkErr, checkRows) => {
        if (checkErr) {
          callback(checkErr);
          return;
        }

        if (!checkRows || checkRows.length === 0) {
          callback(new Error("FORBIDDEN_CAMADA"));
          return;
        }

        const query = `
      INSERT INTO seguimiento_diario_camadas
      (id_camada, id_usuario, fecha_registro, cantidad_aves, mortalidad, peso_promedio, consumo_alimento_kg, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const values = [
          data.id_camada,
          idUsuario,
          data.fecha_registro,
          data.cantidad_aves,
          data.mortalidad,
          data.peso_promedio,
          data.consumo_alimento_kg,
          data.observaciones,
        ];

        db.query(query, values, callback);
      },
    );
  },

  updateSeguimiento: (idSeguimiento, data, idUsuario, callback) => {
    const query = `
      UPDATE seguimiento_diario_camadas
      SET
        fecha_registro = ?,
        cantidad_aves = ?,
        mortalidad = ?,
        peso_promedio = ?,
        consumo_alimento_kg = ?,
        observaciones = ?
      WHERE id_seguimiento = ?
        AND id_usuario = ?
    `;

    const values = [
      data.fecha_registro,
      data.cantidad_aves,
      data.mortalidad,
      data.peso_promedio,
      data.consumo_alimento_kg,
      data.observaciones,
      idSeguimiento,
      idUsuario,
    ];

    db.query(query, values, callback);
  },
};

module.exports = DatoInicialPollo;
