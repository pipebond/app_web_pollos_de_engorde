const db = require("../config/database");

const Usuario = {
  create: (userData, callback) => {
    const query = `
      INSERT INTO usuario
      (nombre_completo, correo_electronico, numero_de_telefono, password_hash)
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      userData.nombre_completo,
      userData.correo_electronico,
      userData.numero_de_telefono,
      userData.password_hash,
    ];

    db.query(query, values, callback);
  },

  findByEmail: (correoElectronico, callback) => {
    const query = "SELECT * FROM usuario WHERE correo_electronico = ? LIMIT 1";
    db.query(query, [correoElectronico], callback);
  },

  findPublicById: (idUsuario, callback) => {
    const query = `
      SELECT id, nombre_completo, correo_electronico, numero_de_telefono
      FROM usuario
      WHERE id = ?
      LIMIT 1
    `;
    db.query(query, [idUsuario], callback);
  },

  getAll: (callback) => {
    const query = `
      SELECT id, nombre_completo, correo_electronico, numero_de_telefono
      FROM usuario
      ORDER BY id DESC
    `;
    db.query(query, callback);
  },

  update: (id, userData, callback) => {
    const query = "UPDATE usuario SET ? WHERE id = ?";
    db.query(query, [userData, id], callback);
  },

  delete: (id, callback) => {
    const query = "DELETE FROM usuario WHERE id = ?";
    db.query(query, id, callback);
  },
};
module.exports = Usuario;
