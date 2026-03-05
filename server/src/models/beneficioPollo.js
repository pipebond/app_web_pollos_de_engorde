const db = require("../config/database");

const BeneficioPollo = {
  create: (data, callback) => {
    const query = `
      INSERT INTO beneficio_pollo
      (id_usuario, id_camada, peso_en_vivo, peso_sacrificado, precio, cantidad_beneficiados)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.id_usuario,
      data.id_camada,
      data.peso_en_vivo,
      data.peso_sacrificado,
      data.precio,
      data.cantidad_beneficiados,
    ];

    db.query(query, values, callback);
  },

  getAllByUser: (idUsuario, callback) => {
    const query = `
      SELECT
        id_beneficio,
        id_usuario,
        beneficio_pollo.id_camada,
        camada_pollos.nombre_camada,
        peso_en_vivo,
        peso_sacrificado,
        precio,
        cantidad_beneficiados,
        beneficio_pollo.created_at
      FROM beneficio_pollo
      LEFT JOIN camada_pollos ON camada_pollos.id_camada = beneficio_pollo.id_camada
      WHERE id_usuario = ?
      ORDER BY beneficio_pollo.created_at DESC
    `;

    db.query(query, [idUsuario], callback);
  },

  userHasCamada: (idUsuario, idCamada, callback) => {
    const query = `
      SELECT 1
      FROM datos_iniciales_pollos
      WHERE id_usuario = ? AND id_camada = ?
      LIMIT 1
    `;

    db.query(query, [idUsuario, idCamada], callback);
  },

  updateByIdAndUser: (idBeneficio, idUsuario, data, callback) => {
    const query = `
      UPDATE beneficio_pollo
      SET
        id_camada = ?,
        peso_en_vivo = ?,
        peso_sacrificado = ?,
        precio = ?,
        cantidad_beneficiados = ?
      WHERE id_beneficio = ? AND id_usuario = ?
    `;

    const values = [
      data.id_camada,
      data.peso_en_vivo,
      data.peso_sacrificado,
      data.precio,
      data.cantidad_beneficiados,
      idBeneficio,
      idUsuario,
    ];

    db.query(query, values, callback);
  },

  deleteByIdAndUser: (idBeneficio, idUsuario, callback) => {
    const query = `
      DELETE FROM beneficio_pollo
      WHERE id_beneficio = ? AND id_usuario = ?
    `;

    db.query(query, [idBeneficio, idUsuario], callback);
  },
};

module.exports = BeneficioPollo;
